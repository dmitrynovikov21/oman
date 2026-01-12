#!/usr/bin/env python3
"""Upload fix and rebuild"""

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

# Upload fixed file
print("[1/4] Uploading fixed route.ts...")
local_file = os.path.join(LOCAL_DIR, "app", "api", "fees", "generate", "route.ts")
remote_file = f"{DEPLOY_DIR}/app/app/api/fees/generate/route.ts"
sftp.put(local_file, remote_file)
print("  OK")

# Build
print("\n[2/4] Rebuilding Docker image...")
stdin, stdout, stderr = ssh.exec_command(
    f"cd {DEPLOY_DIR}/app && docker build -t expertos-web:latest . 2>&1 | tee /tmp/build.log",
    timeout=900
)
output = stdout.read().decode('utf-8', errors='replace')

# Check result
if "Successfully" in output:
    print("[OK] Docker image built!")
else:
    # Find errors
    lines = output.split('\n')
    for i, line in enumerate(lines):
        if "error" in line.lower() or "Error" in line:
            print(f"Error: {line[:200]}")
    print("\n[FAIL] Build failed. Trying to get error details...")
    stdin, stdout, stderr = ssh.exec_command("cat /tmp/build.log | grep -E 'error|Error' | tail -5")
    print(stdout.read().decode('utf-8', errors='replace'))
    sftp.close()
    ssh.close()
    sys.exit(1)

# Start
print("\n[3/4] Starting container...")
ssh.exec_command("docker stop expertos-web 2>/dev/null; docker rm expertos-web 2>/dev/null || true")
time.sleep(2)
stdin, stdout, stderr = ssh.exec_command(f"cd {DEPLOY_DIR} && docker-compose up -d 2>&1")
print(stdout.read().decode('utf-8', errors='replace'))
print(stderr.read().decode('utf-8', errors='replace'))

# Verify
print("\n[4/4] Verifying...")
time.sleep(15)

stdin, stdout, stderr = ssh.exec_command(f"cd {DEPLOY_DIR} && docker-compose ps")
print(stdout.read().decode('utf-8', errors='replace'))

stdin, stdout, stderr = ssh.exec_command("curl -s -m 10 -o /dev/null -w '%{http_code}' http://localhost:3001")
code = stdout.read().decode('utf-8').strip()
print(f"\nHTTP Status: {code}")

if code in ["200", "302", "307"]:
    print(f"\n{'='*60}")
    print(f"  SUCCESS! ExpertOS running at http://{SERVER_IP}:3001")
    print(f"{'='*60}")
else:
    print("\n[!] Getting container logs...")
    stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | tail -15")
    logs = stdout.read().decode('utf-8', errors='replace')
    for line in logs.split('\n'):
        clean = ''.join(c if ord(c) < 128 else '?' for c in line)
        print(clean)

sftp.close()
ssh.close()
