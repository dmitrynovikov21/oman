#!/usr/bin/env python3
"""Deploy Arabic-only OCR and test on reference file"""
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

# Upload
print("\n[1/3] Uploading Arabic-only OCR...")
sftp.put(os.path.join(LOCAL, "app", "api", "ocr", "route.ts"), f"{DEPLOY_DIR}/app/app/api/ocr/route.ts")
print("  [OK]")

# Rebuild
print("\n[2/3] Rebuilding...")
start = time.time()
stdin, stdout, stderr = ssh.exec_command(f"cd {DEPLOY_DIR}/app && docker build -t expertos-web:latest . 2>&1 | tail -10", timeout=600)
output = stdout.read().decode('utf-8', errors='replace')
elapsed = int(time.time() - start)
print(f"  Build: {elapsed}s")

if "successfully" in output.lower():
    print("  [OK]")
    
    # Restart
    print("\n[3/3] Restarting...")
    ssh.exec_command("docker stop expertos-web; docker rm expertos-web")
    time.sleep(3)
    
    run_cmd = '''docker run -d --name expertos-web --restart always --network expertos_default -p 3001:3000 \
      -e DATABASE_URL="postgresql://expertos:ExpertOS2026SecurePass@db:5432/expertos" \
      -e NEXTAUTH_URL="http://193.233.233.217:3001" \
      -e NEXTAUTH_SECRET="ExpertOS2026SuperSecretKey1234567890abcdefghij" \
      -e AUTH_SECRET="ExpertOS2026SuperSecretKey1234567890abcdefghij" \
      -e AUTH_TRUST_HOST="true" \
      -e NEXT_PUBLIC_APP_URL="http://193.233.233.217:3001" \
      -e NODE_ENV="production" \
      -v expertos_uploads_data:/app/public/uploads \
      expertos-web:latest'''
    
    ssh.exec_command(run_cmd)
    print("  Waiting 40s...")
    time.sleep(40)
    ssh.exec_command("docker exec -u root expertos-web chown -R nextjs:nodejs /app/public/uploads")
    
    # Test
    print("\n[4] Testing ARABIC-ONLY OCR on reference file...")
    stdin, stdout, stderr = ssh.exec_command('docker exec expertos-db psql -U expertos -t -c "SELECT id FROM documents WHERE name = \'test_arabic.pdf\' ORDER BY created_at DESC LIMIT 1;"')
    doc_id = stdout.read().decode('utf-8').strip()
    
    if doc_id:
        ssh.exec_command(f'''docker exec expertos-db psql -U expertos -c "UPDATE documents SET \\\"ocrStatus\\\" = 'PENDING', extracted_text = '' WHERE id = '{doc_id}';"''')
        
        print(f"  Testing on {doc_id[:20]}...")
        stdin, stdout, stderr = ssh.exec_command(f'''curl -s -X POST http://localhost:3001/api/ocr -H "Content-Type: application/json" -d '{{"documentId":"{doc_id}"}}' 2>&1''', timeout=300)
        result = stdout.read().decode('utf-8', errors='replace')
        
        try:
            data = json.loads(result)
            if data.get('success'):
                chars = data.get('stats', {}).get('characters', 0)
                text = data.get('document', {}).get('extractedText', '')
                
                print(f"\n  ✅ SUCCESS! {chars} characters")
                print(f"\n{'='*70}")
                print("ARABIC-ONLY OCR RESULT:")
                print('='*70)
                print(text[:2000])
                print('='*70)
            else:
                print(f"  ❌ FAILED: {data.get('error')}")
        except:
            print(f"  Response: {result[:500]}")
else:
    print("  [FAIL]")
    print(output)

sftp.close()
ssh.close()
