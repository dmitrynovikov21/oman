#!/usr/bin/env python3
"""Deploy Tesseract OCR support"""
import subprocess, sys, os, time
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

# Upload files
print("\n[1/3] Uploading files...")
sftp.put(os.path.join(LOCAL, "Dockerfile"), f"{DEPLOY_DIR}/app/Dockerfile")
print("  - Dockerfile (with Tesseract)")
sftp.put(os.path.join(LOCAL, "app", "api", "ocr", "route.ts"), f"{DEPLOY_DIR}/app/app/api/ocr/route.ts")
print("  - app/api/ocr/route.ts (multi-fallback)")

# Rebuild with no cache
print("\n[2/3] Rebuilding Docker image (with Tesseract)...")
print("  This may take a few minutes...")
start = time.time()
stdin, stdout, stderr = ssh.exec_command(
    f"cd {DEPLOY_DIR}/app && docker build --no-cache -t expertos-web:latest . 2>&1 | tail -40",
    timeout=1200
)
output = stdout.read().decode('utf-8', errors='replace')
elapsed = int(time.time() - start)
print(f"  Build completed in {elapsed}s")

if "successfully" in output.lower():
    print("  [OK] Image built!")
    
    # Restart
    print("\n[3/3] Restarting container...")
    ssh.exec_command("docker stop expertos-web; docker rm expertos-web 2>/dev/null")
    time.sleep(3)
    stdin, stdout, stderr = ssh.exec_command(f"cd {DEPLOY_DIR} && docker-compose up -d 2>&1")
    print(stdout.read().decode('utf-8', errors='replace')[:200])
    
    print("\n  Waiting 40s for startup...")
    time.sleep(40)
    
    # Verify Tesseract installed
    print("\n  Checking Tesseract installation...")
    stdin, stdout, stderr = ssh.exec_command("docker exec expertos-web tesseract --version 2>&1 | head -2")
    tesseract_ver = stdout.read().decode('utf-8').strip()
    print(f"  Tesseract: {tesseract_ver}")
    
    stdin, stdout, stderr = ssh.exec_command("docker exec expertos-web pdftotext -v 2>&1 | head -1")
    pdftotext_ver = stdout.read().decode('utf-8').strip()
    print(f"  pdftotext: {pdftotext_ver}")
    
    # Test OCR on 1list.pdf (scanned)
    print("\n  Testing OCR on 1list.pdf (scanned PDF)...")
    stdin, stdout, stderr = ssh.exec_command('docker exec expertos-db psql -U expertos -t -c "SELECT id FROM documents WHERE name = \'1list.pdf\' ORDER BY created_at DESC LIMIT 1;"')
    doc_id = stdout.read().decode('utf-8').strip()
    
    if doc_id:
        print(f"  Document ID: {doc_id}")
        # Reset OCR status first
        ssh.exec_command(f'''docker exec expertos-db psql -U expertos -c "UPDATE documents SET \\\"ocrStatus\\\" = 'PENDING', extracted_text = '' WHERE id = '{doc_id}';"''')
        
        stdin, stdout, stderr = ssh.exec_command(f'''curl -s -X POST http://localhost:3001/api/ocr -H "Content-Type: application/json" -d '{{"documentId":"{doc_id}"}}' 2>&1''', timeout=180)
        result = stdout.read().decode('utf-8', errors='replace')
        print(f"  API Response: {result[:500]}")
        
        time.sleep(3)
        print("\n  OCR Logs:")
        stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | grep -i 'OCR' | tail -10")
        print(stdout.read().decode('utf-8', errors='replace'))
    
    print(f"\n  URL: http://{SERVER[0]}:3001")
else:
    print("  [FAIL] Build error:")
    for line in output.split('\n')[-25:]:
        print(f"  {line[:150]}")

sftp.close()
ssh.close()
