#!/usr/bin/env python3
"""Upload documents fix and final build"""

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

# Upload fixed documents page
print("\n[1/5] Uploading fixed documents/page.tsx...")
local_file = os.path.join(LOCAL_DIR, "app", "(protected)", "documents", "page.tsx")
remote_file = f"{DEPLOY_DIR}/app/app/(protected)/documents/page.tsx"
try:
    sftp.put(local_file, remote_file)
    print("  [OK] Uploaded!")
except Exception as e:
    print(f"  [!] Error: {e}")

# Verify
stdin, stdout, stderr = ssh.exec_command(f"head -3 '{remote_file}'")
print(stdout.read().decode('utf-8'))

# Rebuild
print("\n[2/5] Rebuilding Docker image...")
start = time.time()
stdin, stdout, stderr = ssh.exec_command(
    f"cd {DEPLOY_DIR}/app && docker build -t expertos-web:latest . 2>&1",
    timeout=900
)
output = stdout.read().decode('utf-8', errors='replace')
elapsed = int(time.time() - start)

with open("documents_fix_build.log", "w", encoding="utf-8") as f:
    f.write(output)

if "Successfully" in output:
    print(f"  [OK] Built in {elapsed}s!")
    
    # Start
    print("\n[3/5] Starting containers...")
    ssh.exec_command("docker stop expertos-web 2>/dev/null; docker rm expertos-web 2>/dev/null || true")
    time.sleep(3)
    stdin, stdout, stderr = ssh.exec_command(f"cd {DEPLOY_DIR} && docker-compose up -d 2>&1")
    print(stdout.read().decode('utf-8', errors='replace')[:400])
    print(stderr.read().decode('utf-8', errors='replace')[:400])
    
    # Verify
    print("\n[4/5] Verifying (30s wait for startup)...")
    time.sleep(30)
    
    stdin, stdout, stderr = ssh.exec_command(f"cd {DEPLOY_DIR} && docker-compose ps")
    print(stdout.read().decode('utf-8'))
    
    stdin, stdout, stderr = ssh.exec_command("curl -s -m 10 -o /dev/null -w '%{http_code}' http://localhost:3001")
    code = stdout.read().decode('utf-8').strip()
    print(f"\nHTTP Status: {code}")
    
    if code in ["200", "302", "307"]:
        print("\n" + "="*60)
        print("  SUCCESS! ExpertOS is RUNNING!")
        print(f"  URL: http://{SERVER_IP}:3001")
        print("="*60)
    else:
        print("\n[5/5] Checking logs...")
        stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | tail -25")
        logs = stdout.read().decode('utf-8', errors='replace')
        for line in logs.split('\n'):
            print(''.join(c if ord(c) < 128 else '?' for c in line))
else:
    print(f"\n[FAIL] Build failed after {elapsed}s")
    for line in output.split('\n')[-50:]:
        clean = ''.join(c if ord(c) < 128 else '?' for c in line)
        if clean.strip():
            print(clean[:180])

sftp.close()
ssh.close()
