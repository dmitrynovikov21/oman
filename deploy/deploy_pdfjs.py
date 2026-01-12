#!/usr/bin/env python3
"""Deploy pdfjs-dist OCR fix"""

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

# 1. Upload fixed files
print("\n[1/4] Uploading fixed files...")
sftp.put(os.path.join(LOCAL_DIR, "package.json"), f"{DEPLOY_DIR}/app/package.json")
print("  - package.json (pdfjs-dist)")
sftp.put(os.path.join(LOCAL_DIR, "app", "api", "ocr", "route.ts"), f"{DEPLOY_DIR}/app/app/api/ocr/route.ts")
print("  - app/api/ocr/route.ts")
print("  [OK]")

# 2. Rebuild Docker
print("\n[2/4] Rebuilding Docker image...")
start = time.time()
stdin, stdout, stderr = ssh.exec_command(
    f"cd {DEPLOY_DIR}/app && docker build -t expertos-web:latest . 2>&1",
    timeout=900
)
# Stream output
while True:
    line = stdout.readline()
    if not line:
        break
    if any(k in line.lower() for k in ['step', 'error', 'success', 'failed', 'building']):
        print(f"  {line.strip()[:100]}")

elapsed = int(time.time() - start)
print(f"\n  Build completed in {elapsed}s")

# Check if built
stdin, stdout, stderr = ssh.exec_command("docker images expertos-web:latest --format '{{.CreatedAt}}'")
created = stdout.read().decode('utf-8').strip()
if created:
    print(f"  [OK] Image created: {created}")
    
    # 3. Restart containers
    print("\n[3/4] Restarting containers...")
    ssh.exec_command("docker stop expertos-web; docker rm expertos-web 2>/dev/null")
    time.sleep(3)
    stdin, stdout, stderr = ssh.exec_command(f"cd {DEPLOY_DIR} && docker-compose up -d 2>&1")
    print(stdout.read().decode('utf-8', errors='replace')[:300])
    
    # Wait
    print("\n  Waiting 40s for startup...")
    time.sleep(40)
    
    # 4. Test OCR
    print("\n[4/4] Testing OCR...")
    
    # Find PDF document
    stdin, stdout, stderr = ssh.exec_command('''docker exec expertos-db psql -U expertos -t -c "SELECT id FROM \\\"Document\\\" WHERE name LIKE '%.pdf' ORDER BY \\\"createdAt\\\" DESC LIMIT 1;"''')
    doc_id = stdout.read().decode('utf-8').strip()
    
    if doc_id:
        print(f"  Document ID: {doc_id}")
        stdin, stdout, stderr = ssh.exec_command(f'''curl -s -X POST http://localhost:3001/api/ocr -H "Content-Type: application/json" -d '{{"documentId":"{doc_id}"}}' 2>&1''')
        result = stdout.read().decode('utf-8', errors='replace')
        print(f"  API Response: {result[:500]}")
        
        # Check logs
        stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | grep -i 'OCR' | tail -5")
        print(f"\n  Logs:\n{stdout.read().decode('utf-8', errors='replace')}")
    else:
        print("  No PDF documents found in DB")
    
    print(f"\n  URL: http://{SERVER_IP}:3001")
else:
    print("  [FAIL] Build failed")
    # Show logs
    stdin, stdout, stderr = ssh.exec_command("docker logs -n 30 $(docker ps -aq -l) 2>&1")
    print(stderr.read().decode('utf-8', errors='replace')[-1000:])

sftp.close()
ssh.close()
