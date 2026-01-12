#!/usr/bin/env python3
"""Deploy OCR legacy fix"""
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

# Upload fixed OCR route
print("\n[1/3] Uploading fixed OCR route (legacy pdfjs-dist)...")
sftp.put(os.path.join(LOCAL, "app", "api", "ocr", "route.ts"), f"{DEPLOY_DIR}/app/app/api/ocr/route.ts")
print("  [OK]")

# Rebuild
print("\n[2/3] Rebuilding Docker image...")
start = time.time()
stdin, stdout, stderr = ssh.exec_command(f"cd {DEPLOY_DIR}/app && docker build -t expertos-web:latest . 2>&1 | tail -25", timeout=600)
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
    
    print("\n  Waiting 30s...")
    time.sleep(30)
    
    # Check logs for errors
    print("\n  Checking for errors...")
    stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | grep -iE 'error|fail' | tail -5")
    errors = stdout.read().decode('utf-8', errors='replace')
    if errors.strip():
        print(f"  Errors found:\n{errors}")
    else:
        print("  No errors in recent logs!")
        
    # Test OCR API
    print("\n  Testing OCR API...")
    # First insert a test document if none exist
    stdin, stdout, stderr = ssh.exec_command('docker exec expertos-db psql -U expertos -t -c "SELECT COUNT(*) FROM documents;"')
    count = stdout.read().decode('utf-8').strip()
    print(f"  Documents in DB: {count}")
    
    print(f"\n  URL: http://{SERVER[0]}:3001")
else:
    print("  [FAIL] Build error:")
    print(output[-800:])

sftp.close()
ssh.close()
