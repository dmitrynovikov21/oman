#!/usr/bin/env python3
"""Deploy optimized local OCR"""
import subprocess, sys, os, time, json
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
try:
    import paramiko
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko

SERVER = ("193.233.233.217", "root", "3WP64PLwbT2Y")
DEPLOY_DIR = "/var/www/expertos"
LOCAL = r"c:\gravity\gravity\expertos"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(SERVER[0], username=SERVER[1], password=SERVER[2], timeout=30)
sftp = ssh.open_sftp()
print("[+] Connected!")

# Upload optimized OCR
print("\n[1/3] Uploading optimized OCR route...")
sftp.put(os.path.join(LOCAL, "app", "api", "ocr", "route.ts"), f"{DEPLOY_DIR}/app/app/api/ocr/route.ts")
print("  [OK]")

# Rebuild
print("\n[2/3] Rebuilding Docker image...")
start = time.time()
stdin, stdout, stderr = ssh.exec_command(
    f"cd {DEPLOY_DIR}/app && docker build -t expertos-web:latest . 2>&1 | tail -15",
    timeout=600
)
output = stdout.read().decode('utf-8', errors='replace')
elapsed = int(time.time() - start)
print(f"  Build completed in {elapsed}s")

if "successfully" in output.lower():
    print("  [OK] Image built!")
    
    # Restart
    print("\n[3/3] Restarting container...")
    ssh.exec_command("docker stop expertos-web; docker rm expertos-web")
    time.sleep(3)
    
    run_cmd = '''docker run -d --name expertos-web \
      --restart always --network expertos_default -p 3001:3000 \
      -e DATABASE_URL="postgresql://expertos:ExpertOS2026SecurePass@db:5432/expertos" \
      -e NEXTAUTH_URL="http://193.233.233.217:3001" \
      -e NEXTAUTH_SECRET="ExpertOS2026SuperSecretKey1234567890abcdefghij" \
      -e AUTH_SECRET="ExpertOS2026SuperSecretKey1234567890abcdefghij" \
      -e AUTH_TRUST_HOST="true" \
      -e NEXT_PUBLIC_APP_URL="http://193.233.233.217:3001" \
      -e NODE_ENV="production" \
      -v expertos_uploads_data:/app/public/uploads \
      expertos-web:latest 2>&1'''
    
    stdin, stdout, stderr = ssh.exec_command(run_cmd)
    print(f"  Started: {stdout.read().decode()[:60]}")
    
    print("\n  Waiting 40s...")
    time.sleep(40)
    
    # Fix permissions
    ssh.exec_command("docker exec -u root expertos-web chown -R nextjs:nodejs /app/public/uploads")
    
    # Check health
    stdin, stdout, stderr = ssh.exec_command("curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/")
    code = stdout.read().decode().strip()
    print(f"  Health: HTTP {code}")
    
    if code in ["200", "302", "307"]:
        print("\n  ✅ Ready! Testing optimized OCR...")
        
        # Test on 1list.pdf
        stdin, stdout, stderr = ssh.exec_command('docker exec expertos-db psql -U expertos -t -c "SELECT id FROM documents WHERE name LIKE \'%1list%\' ORDER BY created_at DESC LIMIT 1;"')
        doc_id = stdout.read().decode('utf-8').strip()
        
        if doc_id:
            # Reset
            ssh.exec_command(f'''docker exec expertos-db psql -U expertos -c "UPDATE documents SET \\\"ocrStatus\\\" = 'PENDING', extracted_text = '' WHERE id = '{doc_id}';"''')
            
            print(f"  Testing OCR on document {doc_id[:20]}...")
            stdin, stdout, stderr = ssh.exec_command(f'''curl -s -X POST http://localhost:3001/api/ocr -H "Content-Type: application/json" -d '{{"documentId":"{doc_id}"}}' 2>&1''', timeout=300)
            result = stdout.read().decode('utf-8', errors='replace')
            
            try:
                data = json.loads(result)
                if data.get('success'):
                    chars = data.get('stats', {}).get('characters', 0)
                    text = data.get('document', {}).get('extractedText', '')[:800]
                    print(f"\n  ✅ OCR SUCCESS! {chars} characters")
                    print(f"\n  === EXTRACTED TEXT ===\n{text}\n  === END ===")
                else:
                    print(f"  ❌ OCR FAILED: {data.get('error')}")
            except:
                print(f"  Response: {result[:400]}")
else:
    print("  [FAIL]")
    print(output[-800:])

print(f"\n  URL: http://{SERVER[0]}:3001")
sftp.close()
ssh.close()
