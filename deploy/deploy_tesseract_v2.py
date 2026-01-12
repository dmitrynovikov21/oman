#!/usr/bin/env python3
"""Deploy Tesseract OCR v2"""
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
print("  - Dockerfile")
sftp.put(os.path.join(LOCAL, "app", "api", "ocr", "route.ts"), f"{DEPLOY_DIR}/app/app/api/ocr/route.ts")
print("  - app/api/ocr/route.ts")

# Rebuild
print("\n[2/3] Rebuilding Docker image with Tesseract...")
start = time.time()
stdin, stdout, stderr = ssh.exec_command(
    f"cd {DEPLOY_DIR}/app && docker build -t expertos-web:latest . 2>&1 | tail -30",
    timeout=900
)
output = stdout.read().decode('utf-8', errors='replace')
elapsed = int(time.time() - start)
print(f"  Build completed in {elapsed}s")

if "successfully" in output.lower():
    print("  [OK] Image built!")
    
    # Restart
    print("\n[3/3] Restarting...")
    ssh.exec_command("docker stop expertos-web; docker rm expertos-web 2>/dev/null")
    time.sleep(3)
    stdin, stdout, stderr = ssh.exec_command(f"cd {DEPLOY_DIR} && docker-compose up -d 2>&1")
    print(stdout.read().decode('utf-8', errors='replace')[:200])
    
    print("\n  Waiting 35s...")
    time.sleep(35)
    
    # Verify
    stdin, stdout, stderr = ssh.exec_command("docker exec expertos-web tesseract --version 2>&1 | head -1")
    print(f"  Tesseract: {stdout.read().decode('utf-8').strip()}")
    
    # Test OCR
    print("\n  Testing OCR on 1list.pdf...")
    stdin, stdout, stderr = ssh.exec_command('docker exec expertos-db psql -U expertos -t -c "SELECT id FROM documents WHERE name = \'1list.pdf\' ORDER BY created_at DESC LIMIT 1;"')
    doc_id = stdout.read().decode('utf-8').strip()
    
    if doc_id:
        # Reset status
        ssh.exec_command(f'''docker exec expertos-db psql -U expertos -c "UPDATE documents SET \\\"ocrStatus\\\" = 'PENDING', extracted_text = '' WHERE id = '{doc_id}';"''')
        
        stdin, stdout, stderr = ssh.exec_command(f'''curl -s -X POST http://localhost:3001/api/ocr -H "Content-Type: application/json" -d '{{"documentId":"{doc_id}"}}' 2>&1''', timeout=180)
        result = stdout.read().decode('utf-8', errors='replace')
        print(f"  Response: {result[:600]}")
        
        time.sleep(2)
        stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | grep -i 'OCR' | tail -12")
        print(f"\n  Logs:\n{stdout.read().decode('utf-8', errors='replace')}")
    
    print(f"\n  URL: http://{SERVER[0]}:3001")
else:
    print("  [FAIL] Build error:")
    print(output[-1500:])

sftp.close()
ssh.close()
