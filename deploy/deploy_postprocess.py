#!/usr/bin/env python3
"""Deploy OCR with post-processing and test"""
import subprocess, sys, os, time, json
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
try:
    import paramiko
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko

SERVER = ("193.233.233.217", "root", "3WP64PLwbT2Y")
LOCAL = r"c:\gravity\gravity\expertos"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(SERVER[0], username=SERVER[1], password=SERVER[2], timeout=30)
sftp = ssh.open_sftp()
print("[+] Connected!")

# Upload
print("\n[1/3] Uploading OCR with post-processing...")
sftp.put(os.path.join(LOCAL, "app", "api", "ocr", "route.ts"), "/var/www/expertos/app/app/api/ocr/route.ts")
print("  [OK]")

# Rebuild
print("\n[2/3] Rebuilding...")
start = time.time()
stdin, stdout, stderr = ssh.exec_command("cd /var/www/expertos/app && docker build -t expertos-web:latest . 2>&1 | tail -10", timeout=600)
output = stdout.read().decode('utf-8', errors='replace')
print(f"  Build: {int(time.time()-start)}s")

if "successfully" in output.lower():
    print("  [OK]")
    
    # Restart
    print("\n[3/3] Restarting...")
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
    
    # Test
    print("\n[4] Testing OCR with POST-PROCESSING...")
    stdin, stdout, stderr = ssh.exec_command('docker exec expertos-db psql -U expertos -t -c "SELECT id FROM documents WHERE name = \'test_arabic.pdf\' ORDER BY created_at DESC LIMIT 1;"')
    doc_id = stdout.read().decode('utf-8').strip()
    
    if doc_id:
        ssh.exec_command(f'''docker exec expertos-db psql -U expertos -c "UPDATE documents SET \\\"ocrStatus\\\" = 'PENDING', extracted_text = '' WHERE id = '{doc_id}';"''')
        
        print(f"  Processing {doc_id[:20]}...")
        stdin, stdout, stderr = ssh.exec_command(f'''curl -s -X POST http://localhost:3001/api/ocr -H "Content-Type: application/json" -d '{{"documentId":"{doc_id}"}}' 2>&1''', timeout=300)
        result = stdout.read().decode('utf-8', errors='replace')
        
        try:
            data = json.loads(result)
            if data.get('success'):
                chars = data.get('stats', {}).get('characters', 0)
                text = data.get('document', {}).get('extractedText', '')
                
                print(f"\n  ✅ SUCCESS! {chars} characters")
                print(f"\n{'='*70}")
                print("POST-PROCESSED OCR RESULT:")
                print('='*70)
                
                # Show key fixed items
                fixes = [
                    ("مكتب رقم ٧" in text, "Office number ٧", "مكتب رقم ٧"),
                    ("قلهات" in text, "Company name قلهات", "قلهات"),
                    ("الابتدائية" in text, "Court name الابتدائية", "الابتدائية"),
                    ("REF2401" in text, "Reference REF2401", "REF2401"),
                    ("دعوى افتتاحية" in text, "Legal term with space", "دعوى افتتاحية"),
                ]
                
                print("\n  POST-PROCESSING FIXES APPLIED:")
                for found, desc, term in fixes:
                    status = "✅" if found else "❌"
                    print(f"    {status} {desc}: {term}")
                
                print(f"\n  First 1500 chars:\n{text[:1500]}")
                print('='*70)
            else:
                print(f"  ❌ FAILED: {data.get('error')}")
        except Exception as e:
            print(f"  Error: {e}")
            print(f"  Response: {result[:500]}")
else:
    print("  [FAIL]")
    print(output)

sftp.close()
ssh.close()
