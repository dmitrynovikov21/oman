#!/usr/bin/env python3
"""Deploy pdf-parse fix"""

import subprocess, sys, os, time
os.environ["PYTHONIOENCODING"] = "utf-8"
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

try:
    import paramiko
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko

SERVER_IP = "193.233.233.217"
SERVER_USER = "root"
SERVER_PASS = "3WP64PLwbT2Y"
DEPLOY_DIR = "/var/www/expertos"
LOCAL_DIR = r"c:\gravity\gravity\expertos"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS, timeout=30)
sftp = ssh.open_sftp()
print("[+] Connected!")

# 1. Upload fixed package.json
print("\n[1/4] Uploading fixed package.json with pdf-parse@1.1.1...")
sftp.put(os.path.join(LOCAL_DIR, "package.json"), f"{DEPLOY_DIR}/app/package.json")
print("  [OK]")

# 2. Clear npm cache and node_modules on server (force fresh install)
print("\n[2/4] Clearing node_modules cache...")
stdin, stdout, stderr = ssh.exec_command(f"rm -rf {DEPLOY_DIR}/app/node_modules {DEPLOY_DIR}/app/package-lock.json 2>&1")
stdout.read()
print("  [OK]")

# 3. Rebuild with no cache
print("\n[3/4] Rebuilding Docker image (no cache)...")
start = time.time()
stdin, stdout, stderr = ssh.exec_command(
    f"cd {DEPLOY_DIR}/app && docker build --no-cache -t expertos-web:latest . 2>&1 | tail -20",
    timeout=900
)
output = stdout.read().decode('utf-8', errors='replace')
elapsed = int(time.time() - start)
print(f"  Build completed in {elapsed}s")

if "Successfully" in output or "successfully" in output.lower():
    print("  [OK] Image built!")
    
    # 4. Restart containers
    print("\n[4/4] Restarting containers...")
    ssh.exec_command("docker stop expertos-web; docker rm expertos-web")
    time.sleep(3)
    stdin, stdout, stderr = ssh.exec_command(f"cd {DEPLOY_DIR} && docker-compose up -d 2>&1")
    print(stdout.read().decode('utf-8', errors='replace')[:300])
    
    # Wait
    print("\n  Waiting 40s for startup...")
    time.sleep(40)
    
    # Verify pdf-parse version
    print("\n  Checking pdf-parse version in container...")
    stdin, stdout, stderr = ssh.exec_command("docker exec expertos-web cat /app/node_modules/pdf-parse/package.json | grep version")
    print(f"  {stdout.read().decode('utf-8').strip()}")
    
    # Test OCR
    print("\n  Finding document for OCR test...")
    stdin, stdout, stderr = ssh.exec_command('''docker exec expertos-db psql -U expertos -t -c "SELECT id, name FROM \\\"Document\\\" WHERE name LIKE '%receipt%' OR name LIKE '%pdf%' LIMIT 1;"''')
    doc_info = stdout.read().decode('utf-8').strip()
    if doc_info:
        doc_id = doc_info.split('|')[0].strip()
        print(f"  Document: {doc_info}")
        print(f"  Testing OCR API...")
        stdin, stdout, stderr = ssh.exec_command(f'''curl -s -X POST http://localhost:3001/api/ocr -H "Content-Type: application/json" -d '{{"documentId":"{doc_id}"}}' 2>&1''')
        result = stdout.read().decode('utf-8', errors='replace')
        print(f"  API Response: {result[:400]}")
    
    print(f"\n  URL: http://{SERVER_IP}:3001")
else:
    print("  [FAIL] Build failed")
    for line in output.split('\n'):
        print(f"  {line[:150]}")

sftp.close()
ssh.close()
