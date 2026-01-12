#!/usr/bin/env python3
"""Start container via docker run"""
import subprocess, sys, os, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
try:
    import paramiko
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("193.233.233.217", username="root", password="3WP64PLwbT2Y", timeout=30)
print("[+] Connected!")

# Stop existing container
print("\n[1/3] Stopping old container...")
ssh.exec_command("docker stop expertos-web 2>/dev/null; docker rm expertos-web 2>/dev/null")
time.sleep(3)

# Start with docker run
print("\n[2/3] Starting expertos-web with docker run...")
run_cmd = '''docker run -d --name expertos-web \
  --restart always \
  -p 3001:3000 \
  -e DATABASE_URL="postgresql://expertos:ExpertOS2026SecurePass@expertos-db:5432/expertos" \
  -e NEXTAUTH_URL="http://193.233.233.217:3001" \
  -e NEXTAUTH_SECRET="ExpertOS2026SuperSecretKey1234567890abcdefghij" \
  -e AUTH_SECRET="ExpertOS2026SuperSecretKey1234567890abcdefghij" \
  -e AUTH_TRUST_HOST="true" \
  -e NEXT_PUBLIC_APP_URL="http://193.233.233.217:3001" \
  -e NODE_ENV="production" \
  --link expertos-db:db \
  -v /var/lib/docker/volumes/expertos_uploads_data/_data:/app/public/uploads \
  expertos-web:latest 2>&1'''

stdin, stdout, stderr = ssh.exec_command(run_cmd)
result = stdout.read().decode('utf-8', errors='replace')
print(f"  Result: {result[:100]}")

print("\n  Waiting 40s for startup...")
time.sleep(40)

# Check status
print("\n[3/3] Verifying...")
stdin, stdout, stderr = ssh.exec_command("docker ps --format 'table {{.Names}}\\t{{.Status}}' | grep expertos")
print(f"  Containers:\n{stdout.read().decode('utf-8')}")

stdin, stdout, stderr = ssh.exec_command("curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/dashboard")
code = stdout.read().decode('utf-8').strip()
print(f"  Dashboard: HTTP {code}")

if code == "200":
    # Test OCR
    print("\n  Testing OCR on 1list.pdf...")
    stdin, stdout, stderr = ssh.exec_command('docker exec expertos-db psql -U expertos -t -c "SELECT id FROM documents WHERE name LIKE \'%1list%\' ORDER BY created_at DESC LIMIT 1;"')
    doc_id = stdout.read().decode('utf-8').strip()
    
    if doc_id:
        # Reset status
        ssh.exec_command(f'''docker exec expertos-db psql -U expertos -c "UPDATE documents SET \\\"ocrStatus\\\" = 'PENDING', extracted_text = '' WHERE id = '{doc_id}';"''')
        
        print(f"  Document ID: {doc_id}")
        stdin, stdout, stderr = ssh.exec_command(f'''curl -s -X POST http://localhost:3001/api/ocr -H "Content-Type: application/json" -d '{{"documentId":"{doc_id}"}}' 2>&1''', timeout=180)
        result = stdout.read().decode('utf-8', errors='replace')
        print(f"  OCR Response: {result[:700]}")
        
        time.sleep(2)
        stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | grep -i 'OCR\\|tesseract\\|pdfto' | tail -10")
        print(f"\n  OCR Logs:\n{stdout.read().decode('utf-8', errors='replace')}")
else:
    # Check container logs
    print("\n  Container logs:")
    stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | tail -20")
    print(stdout.read().decode('utf-8', errors='replace'))

print(f"\n  URL: http://193.233.233.217:3001")
ssh.close()
