#!/usr/bin/env python3
"""Deploy unpdf OCR solution"""
import subprocess, sys, os, time
os.environ["PYTHONIOENCODING"] = "utf-8"
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
sftp.put(os.path.join(LOCAL, "package.json"), f"{DEPLOY_DIR}/app/package.json")
print("  - package.json (unpdf)")
sftp.put(os.path.join(LOCAL, "app", "api", "ocr", "route.ts"), f"{DEPLOY_DIR}/app/app/api/ocr/route.ts")
print("  - app/api/ocr/route.ts")

# Rebuild with no cache to get new dependency
print("\n[2/3] Rebuilding Docker image...")
start = time.time()
stdin, stdout, stderr = ssh.exec_command(f"cd {DEPLOY_DIR}/app && docker build --no-cache -t expertos-web:latest . 2>&1 | tail -30", timeout=900)
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
    
    print("\n  Waiting 35s...")
    time.sleep(35)
    
    # Check unpdf installed
    print("\n  Checking unpdf installation...")
    stdin, stdout, stderr = ssh.exec_command("docker exec expertos-web ls /app/node_modules/unpdf 2>&1 | head -3")
    unpdf_check = stdout.read().decode('utf-8')
    if 'No such' in unpdf_check:
        print("  [!] unpdf NOT installed")
    else:
        print(f"  unpdf installed: {unpdf_check.strip()}")
        
    # Test OCR
    print("\n  Testing OCR API...")
    stdin, stdout, stderr = ssh.exec_command('docker exec expertos-db psql -U expertos -t -c "SELECT id FROM documents LIMIT 1;"')
    doc_id = stdout.read().decode('utf-8').strip()
    
    if doc_id:
        print(f"  Document ID: {doc_id}")
        stdin, stdout, stderr = ssh.exec_command(f'''curl -s -X POST http://localhost:3001/api/ocr -H "Content-Type: application/json" -d '{{"documentId":"{doc_id}"}}' 2>&1''', timeout=60)
        result = stdout.read().decode('utf-8', errors='replace')
        print(f"  API Response: {result[:500]}")
        
        # Check logs
        time.sleep(2)
        stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | grep -i 'OCR' | tail -5")
        print(f"\n  OCR Logs:\n{stdout.read().decode('utf-8', errors='replace')}")
    
    print(f"\n  URL: http://{SERVER[0]}:3001")
else:
    print("  [FAIL] Build error:")
    for line in output.split('\n')[-20:]:
        print(f"  {line[:120]}")

sftp.close()
ssh.close()
