#!/usr/bin/env python3
"""Clean disk space and rebuild"""
import subprocess, sys, time, json
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
try:
    import paramiko
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko

KEY_PHRASES = [
    ("أحمد بن سالم بن عبدالله البادي", "Plaintiff name"),
    ("شركة الجرادي وقيس الراشدي", "Law firm"),
    ("المحكمة الابتدائية بصور", "Court name"),
    ("شركة بي اس أي مارين قلهات", "Defendant"),
    ("95788279", "Phone 1"),
    ("REF2401040246", "Reference"),
]

for attempt in range(3):
    print(f"\n[Attempt {attempt+1}/3] Connecting...")
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect("193.233.233.217", username="root", password="3WP64PLwbT2Y", timeout=60, banner_timeout=60)
        print("[+] Connected!")
        break
    except:
        time.sleep(5)
else:
    print("[FAIL]")
    sys.exit(1)

# 1. Check disk space
print("\n[1/6] Checking disk space...")
stdin, stdout, stderr = ssh.exec_command("df -h /", timeout=30)
print(stdout.read().decode())

# 2. Clean Docker
print("\n[2/6] Cleaning Docker (prune)...")
stdin, stdout, stderr = ssh.exec_command("docker system prune -af --volumes 2>&1 | tail -5", timeout=120)
print(stdout.read().decode())

# 3. Clean npm cache
print("\n[3/6] Cleaning npm cache...")
stdin, stdout, stderr = ssh.exec_command("rm -rf /root/.npm/_cacache/* 2>&1", timeout=30)
print("  [OK]")

# 4. Check disk again
print("\n[4/6] Disk space after cleanup...")
stdin, stdout, stderr = ssh.exec_command("df -h /", timeout=30)
print(stdout.read().decode())

# 5. Rebuild Docker
print("\n[5/6] Rebuilding Docker...")
stdin, stdout, stderr = ssh.exec_command(
    "cd /var/www/expertos/app && docker build -t expertos-web:latest . 2>&1 | tail -15",
    timeout=600
)
output = stdout.read().decode('utf-8', errors='replace')
print(output)

if "successfully" in output.lower():
    print("  [OK] Build successful!")
    
    # Restart container
    print("\n  Restarting container...")
    ssh.exec_command("docker stop expertos-web; docker rm expertos-web", timeout=30)
    time.sleep(3)
    
    run_cmd = '''docker run -d --name expertos-web --restart always --network expertos_default -p 3001:3000 \
      -e DATABASE_URL="postgresql://expertos:ExpertOS2026SecurePass@db:5432/expertos" \
      -e NEXTAUTH_URL="http://193.233.233.217:3001" \
      -e NEXTAUTH_SECRET="ExpertOS2026SuperSecretKey1234567890abcdefghij" \
      -e AUTH_SECRET="ExpertOS2026SuperSecretKey1234567890abcdefghij" \
      -e AUTH_TRUST_HOST="true" \
      -e NODE_ENV="production" \
      -v expertos_uploads_data:/app/public/uploads \
      expertos-web:latest'''
    ssh.exec_command(run_cmd, timeout=30)
    
    print("  Waiting 45s...")
    time.sleep(45)
    ssh.exec_command("docker exec -u root expertos-web chown -R nextjs:nodejs /app/public/uploads", timeout=30)
    
    # 6. Test OCR
    print("\n[6/6] Testing OCR...")
    stdin, stdout, stderr = ssh.exec_command('docker exec expertos-db psql -U expertos -t -c "SELECT id FROM documents WHERE name = \'test_arabic.pdf\' ORDER BY created_at DESC LIMIT 1;"', timeout=30)
    doc_id = stdout.read().decode().strip()
    
    if doc_id:
        ssh.exec_command(f'''docker exec expertos-db psql -U expertos -c "UPDATE documents SET \\"ocrStatus\\" = 'PENDING', extracted_text = '' WHERE id = '{doc_id}';"''', timeout=30)
        
        stdin, stdout, stderr = ssh.exec_command(
            f'''curl -s -X POST http://localhost:3001/api/ocr -H "Content-Type: application/json" -d '{{"documentId":"{doc_id}"}}' ''',
            timeout=300
        )
        result = stdout.read().decode('utf-8', errors='replace')
        
        try:
            data = json.loads(result)
            if data.get('success'):
                text = data.get('document', {}).get('extractedText', '')
                
                found = 0
                print("\n  Results:")
                for phrase, desc in KEY_PHRASES:
                    if phrase in text:
                        found += 1
                        print(f"    ✅ {desc}")
                    else:
                        print(f"    ❌ {desc}")
                
                accuracy = (found / len(KEY_PHRASES)) * 100
                print(f"\n  🎯 ACCURACY: {accuracy:.1f}%")
                
                if accuracy >= 95:
                    print("  🎉 TARGET ACHIEVED!")
        except:
            print(f"  Response: {result[:300]}")
else:
    print("  [FAIL] Build failed")

ssh.close()
