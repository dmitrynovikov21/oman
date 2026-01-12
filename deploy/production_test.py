#!/usr/bin/env python3
"""Fix container startup and run comprehensive tests"""
import subprocess, sys, os, time, json
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
try:
    import paramiko
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko

SERVER = ("193.233.233.217", "root", "3WP64PLwbT2Y")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(SERVER[0], username=SERVER[1], password=SERVER[2], timeout=30)
print("[+] Connected to production server!")
print("="*70)

# 1. Check and fix container
print("\n[1] CONTAINER STATUS")
print("-"*50)
stdin, stdout, stderr = ssh.exec_command("docker ps -a --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}' | grep expertos")
containers = stdout.read().decode('utf-8')
print(containers)

# Check if web container is running
if "expertos-web" not in containers or "Up" not in containers:
    print("\n  [!] expertos-web not running, fixing...")
    
    # Remove old container
    ssh.exec_command("docker stop expertos-web 2>/dev/null; docker rm expertos-web 2>/dev/null")
    time.sleep(2)
    
    # Create network if needed
    ssh.exec_command("docker network create expertos_network 2>/dev/null")
    
    # Connect db to network
    ssh.exec_command("docker network connect expertos_network expertos-db 2>/dev/null")
    
    # Start container with proper network
    run_cmd = '''docker run -d --name expertos-web \
      --restart always \
      --network expertos_network \
      -p 3001:3000 \
      -e DATABASE_URL="postgresql://expertos:ExpertOS2026SecurePass@expertos-db:5432/expertos" \
      -e NEXTAUTH_URL="http://193.233.233.217:3001" \
      -e NEXTAUTH_SECRET="ExpertOS2026SuperSecretKey1234567890abcdefghij" \
      -e AUTH_SECRET="ExpertOS2026SuperSecretKey1234567890abcdefghij" \
      -e AUTH_TRUST_HOST="true" \
      -e NEXT_PUBLIC_APP_URL="http://193.233.233.217:3001" \
      -e NODE_ENV="production" \
      -v expertos_uploads_data:/app/public/uploads \
      expertos-web:latest 2>&1'''
    
    stdin, stdout, stderr = ssh.exec_command(run_cmd)
    result = stdout.read().decode('utf-8')
    print(f"  Started: {result[:80]}...")
    
    print("  Waiting 40s for startup...")
    time.sleep(40)

# 2. Health checks
print("\n[2] HEALTH CHECKS")
print("-"*50)

endpoints = [
    ("Dashboard", "/dashboard"),
    ("API Health", "/api/health"),
    ("Login Page", "/login"),
    ("Cases API", "/api/cases"),
]

for name, path in endpoints:
    stdin, stdout, stderr = ssh.exec_command(f"curl -s -o /dev/null -w '%{{http_code}}' http://localhost:3001{path}")
    code = stdout.read().decode('utf-8').strip()
    status = "✅" if code in ["200", "401", "302"] else "❌"
    print(f"  {status} {name}: HTTP {code}")

# 3. Database check
print("\n[3] DATABASE STATUS")
print("-"*50)
stdin, stdout, stderr = ssh.exec_command('docker exec expertos-db psql -U expertos -c "SELECT COUNT(*) as cases FROM cases; SELECT COUNT(*) as documents FROM documents; SELECT COUNT(*) as users FROM users;"')
print(stdout.read().decode('utf-8'))

# 4. Recent logs
print("\n[4] RECENT SERVER LOGS")
print("-"*50)
stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | tail -30")
logs = stdout.read().decode('utf-8', errors='replace')
print(logs[:1500])

# 5. Error check
print("\n[5] ERRORS IN LOGS")
print("-"*50)
stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | grep -iE 'error|fail|exception' | tail -10")
errors = stdout.read().decode('utf-8', errors='replace')
if errors.strip():
    print(errors)
else:
    print("  ✅ No errors found!")

# 6. OCR Test
print("\n[6] OCR FUNCTIONALITY TEST")
print("-"*50)
stdin, stdout, stderr = ssh.exec_command('docker exec expertos-db psql -U expertos -t -c "SELECT id, name FROM documents WHERE name LIKE \'%.pdf\' AND file_path IS NOT NULL ORDER BY created_at DESC LIMIT 1;"')
doc_info = stdout.read().decode('utf-8').strip()

if doc_info:
    parts = doc_info.split('|')
    doc_id = parts[0].strip()
    doc_name = parts[1].strip() if len(parts) > 1 else "unknown"
    
    print(f"  Testing with: {doc_name}")
    print(f"  Document ID: {doc_id}")
    
    # Reset and test
    ssh.exec_command(f'''docker exec expertos-db psql -U expertos -c "UPDATE documents SET \\\"ocrStatus\\\" = 'PENDING', extracted_text = '' WHERE id = '{doc_id}';"''')
    
    stdin, stdout, stderr = ssh.exec_command(f'''curl -s -X POST http://localhost:3001/api/ocr -H "Content-Type: application/json" -d '{{"documentId":"{doc_id}"}}' 2>&1''', timeout=120)
    result = stdout.read().decode('utf-8', errors='replace')
    
    try:
        data = json.loads(result)
        if data.get('success'):
            print(f"  ✅ OCR SUCCESS!")
            print(f"     Pages: {data.get('stats', {}).get('pages')}")
            print(f"     Characters: {data.get('stats', {}).get('characters')}")
        else:
            print(f"  ❌ OCR FAILED: {data.get('error', 'Unknown')}")
            if data.get('details'):
                print(f"     Details: {data.get('details')[:200]}")
    except:
        print(f"  Response: {result[:300]}")
else:
    print("  No PDF documents found for testing")

# 7. Tesseract check
print("\n[7] OCR TOOLS STATUS")
print("-"*50)
stdin, stdout, stderr = ssh.exec_command("docker exec expertos-web tesseract --version 2>&1 | head -1")
tesseract = stdout.read().decode('utf-8').strip()
print(f"  Tesseract: {tesseract if tesseract else 'NOT INSTALLED'}")

stdin, stdout, stderr = ssh.exec_command("docker exec expertos-web pdftotext -v 2>&1 | head -1")
pdftotext = stdout.read().decode('utf-8').strip()
print(f"  pdftotext: {pdftotext if pdftotext else 'NOT INSTALLED'}")

# 8. Summary
print("\n" + "="*70)
print("PRODUCTION STATUS SUMMARY")
print("="*70)
print(f"  URL: http://{SERVER[0]}:3001")

stdin, stdout, stderr = ssh.exec_command("curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/dashboard")
code = stdout.read().decode('utf-8').strip()
if code == "200":
    print("  Status: ✅ ONLINE")
else:
    print(f"  Status: ❌ ISSUES (HTTP {code})")

ssh.close()
