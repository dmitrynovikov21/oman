#!/usr/bin/env python3
"""Deploy final OCR fix and test accuracy"""
import subprocess, sys, os, time, json
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
    ("الدائرة العمالية", "Labor division"),
    ("شركة بي اس أي مارين قلهات", "Defendant"),
    ("ولاية بوشر", "State"),
    ("غلا التجارية", "Area"),
    ("بناية أبراج النهضة", "Building"),
    ("مكتب رقم", "Office"),
    ("95788279", "Phone 1"),
    ("24502998", "Phone 2"),
    ("صحيفة دعوى افتتاحية", "Legal term"),
    ("REF2401040246", "Reference number"),
    ("قانون العمل", "Labor law"),
    ("المدعي", "Plaintiff term"),
    ("المدعى عليها", "Defendant term"),
]

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("193.233.233.217", username="root", password="3WP64PLwbT2Y", timeout=30)
sftp = ssh.open_sftp()
print("[+] Connected!")

# 1. Upload fix
print("\n[1/4] Uploading final OCR fix...")
sftp.put(r"c:\gravity\gravity\expertos\app\api\ocr\route.ts", "/var/www/expertos/app/app/api/ocr/route.ts")
print("  [OK]")

# 2. Rebuild
print("\n[2/4] Rebuilding...")
start = time.time()
stdin, stdout, stderr = ssh.exec_command("cd /var/www/expertos/app && docker build -t expertos-web:latest . 2>&1 | tail -8", timeout=600)
output = stdout.read().decode('utf-8', errors='replace')
print(f"  Build: {int(time.time()-start)}s")

if "successfully" in output.lower():
    print("  [OK]")
    
    # 3. Restart
    print("\n[3/4] Restarting...")
    ssh.exec_command("docker stop expertos-web; docker rm expertos-web")
    time.sleep(3)
    ssh.exec_command('''docker run -d --name expertos-web --restart always --network expertos_default -p 3001:3000 \
      -e DATABASE_URL="postgresql://expertos:ExpertOS2026SecurePass@db:5432/expertos" \
      -e NEXTAUTH_URL="http://193.233.233.217:3001" \
      -e NEXTAUTH_SECRET="ExpertOS2026SuperSecretKey1234567890abcdefghij" \
      -e AUTH_SECRET="ExpertOS2026SuperSecretKey1234567890abcdefghij" \
      -e AUTH_TRUST_HOST="true" \
      -e NEXT_PUBLIC_APP_URL="http://193.233.233.217:3001" \
      -e NODE_ENV="production" \
      -v expertos_uploads_data:/app/public/uploads \
      expertos-web:latest''')
    
    print("  Waiting 40s...")
    time.sleep(40)
    ssh.exec_command("docker exec -u root expertos-web chown -R nextjs:nodejs /app/public/uploads")
    
    # 4. Re-run OCR and test
    print("\n[4/4] Re-running OCR with fix...")
    stdin, stdout, stderr = ssh.exec_command('docker exec expertos-db psql -U expertos -t -c "SELECT id FROM documents WHERE name = \'test_arabic.pdf\' ORDER BY created_at DESC LIMIT 1;"')
    doc_id = stdout.read().decode('utf-8').strip()
    
    if doc_id:
        ssh.exec_command(f'''docker exec expertos-db psql -U expertos -c "UPDATE documents SET \\\"ocrStatus\\\" = 'PENDING', extracted_text = '' WHERE id = '{doc_id}';"''')
        
        stdin, stdout, stderr = ssh.exec_command(f'''curl -s -X POST http://localhost:3001/api/ocr -H "Content-Type: application/json" -d '{{"documentId":"{doc_id}"}}' 2>&1''', timeout=300)
        result = stdout.read().decode('utf-8', errors='replace')
        
        try:
            data = json.loads(result)
            if data.get('success'):
                text = data.get('document', {}).get('extractedText', '')
                
                # Check accuracy
                found = 0
                for phrase, desc in KEY_PHRASES:
                    if phrase in text:
                        found += 1
                
                accuracy = (found / len(KEY_PHRASES)) * 100
                
                print(f"\n  🎯 FINAL ACCURACY: {accuracy:.1f}% ({found}/{len(KEY_PHRASES)})")
                
                if accuracy == 100:
                    print("\n  🎉 100% ACCURACY ACHIEVED!")
                
                # Show results
                for phrase, desc in KEY_PHRASES:
                    icon = "✅" if phrase in text else "❌"
                    print(f"  {icon} {desc}")
            else:
                print(f"  ❌ Error: {data.get('error')}")
        except:
            print(f"  Response: {result[:300]}")
else:
    print("  [FAIL]")
    print(output)

sftp.close()
ssh.close()
