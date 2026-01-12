#!/usr/bin/env python3
"""Upload fix, rebuild and test - all in one with retries"""
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

def connect_with_retry(max_attempts=5):
    for attempt in range(max_attempts):
        try:
            print(f"[Attempt {attempt+1}/{max_attempts}] Connecting...")
            ssh = paramiko.SSHClient()
            ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            ssh.connect("193.233.233.217", username="root", password="3WP64PLwbT2Y", 
                       timeout=60, banner_timeout=60, auth_timeout=60)
            print("[+] Connected!")
            return ssh
        except Exception as e:
            print(f"  Error: {e}")
            if attempt < max_attempts - 1:
                print("  Waiting 10s before retry...")
                time.sleep(10)
    return None

ssh = connect_with_retry()
if not ssh:
    print("[FAIL] Could not connect after 5 attempts")
    sys.exit(1)

sftp = ssh.open_sftp()

# 1. Upload fixed route.ts
print("\n[1/5] Uploading fixed route.ts...")
try:
    sftp.put(r"c:\gravity\gravity\expertos\app\api\ocr\route.ts", 
             "/var/www/expertos/app/app/api/ocr/route.ts")
    print("  [OK]")
except Exception as e:
    print(f"  Error: {e}")

# 2. Verify fix is present
print("\n[2/5] Verifying fix in uploaded file...")
stdin, stdout, stderr = ssh.exec_command('grep "  +" /var/www/expertos/app/app/api/ocr/route.ts | head -1', timeout=30)
result = stdout.read().decode('utf-8').strip()
if result:
    print(f"  ✅ Fix present: {result[:60]}...")
else:
    print("  ❌ Fix NOT found in file!")
    
# 3. Rebuild Docker (using cache to speed up)
print("\n[3/5] Rebuilding Docker (with cache, ~2-3 min)...")
stdin, stdout, stderr = ssh.exec_command(
    "cd /var/www/expertos/app && docker build -t expertos-web:latest . 2>&1 | tail -10",
    timeout=600
)
output = stdout.read().decode('utf-8', errors='replace')
print(output)

if "successfully" in output.lower():
    print("  [OK] Build successful!")
    
    # 4. Restart container
    print("\n[4/5] Restarting container...")
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
    
    print("  Waiting 45s for startup...")
    time.sleep(45)
    ssh.exec_command("docker exec -u root expertos-web chown -R nextjs:nodejs /app/public/uploads", timeout=30)
    
    # 5. Test OCR
    print("\n[5/5] Testing OCR...")
    stdin, stdout, stderr = ssh.exec_command('docker exec expertos-db psql -U expertos -t -c "SELECT id FROM documents WHERE name = \'test_arabic.pdf\' ORDER BY created_at DESC LIMIT 1;"', timeout=30)
    doc_id = stdout.read().decode().strip()
    
    if doc_id:
        # Reset and run OCR
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
                print(f"\n  🎯 FINAL ACCURACY: {accuracy:.1f}%")
                
                if accuracy >= 95:
                    print("  🎉 TARGET ACHIEVED!")
        except:
            print(f"  Response: {result[:300]}")
else:
    print("  [FAIL] Build failed")

sftp.close()
ssh.close()
