#!/usr/bin/env python3
"""Direct upload of fixed route.ts files"""

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

# Check directory structure
print("\n[1] Checking server directory structure...")
stdin, stdout, stderr = ssh.exec_command(f"ls -la {DEPLOY_DIR}/app/app/api/")
print(stdout.read().decode('utf-8'))

# Upload reports/generate/route.ts directly
print("\n[2] Uploading fixed reports/generate/route.ts...")
local_file = os.path.join(LOCAL_DIR, "app", "api", "reports", "generate", "route.ts")

# Read local file content
with open(local_file, 'r', encoding='utf-8') as f:
    content = f.read()

print(f"  Local file has Promise<NextResponse>: {'Promise<NextResponse>' in content}")

# Write to server using echo
# Escape for bash
content_escaped = content.replace("'", "'\\''")

remote_path = f"{DEPLOY_DIR}/app/app/api/reports/generate/route.ts"
print(f"  Remote path: {remote_path}")

# Use sftp to put file
try:
    sftp.put(local_file, remote_path)
    print("  [OK] Uploaded via SFTP")
except Exception as e:
    print(f"  [!] SFTP Error: {e}")

# Verify
print("\n[3] Verifying upload...")
stdin, stdout, stderr = ssh.exec_command(f"grep 'Promise<NextResponse>' {remote_path}")
result = stdout.read().decode('utf-8')
if result:
    print("  [OK] Promise<NextResponse> found in file")
else:
    print("  [!] Promise<NextResponse> NOT found!")
    stdin, stdout, stderr = ssh.exec_command(f"grep 'new Promise' {remote_path}")
    print(f"  Actual line: {stdout.read().decode('utf-8')}")

# Also upload fees route
print("\n[4] Uploading fees/generate/route.ts...")
local_fees = os.path.join(LOCAL_DIR, "app", "api", "fees", "generate", "route.ts")
remote_fees = f"{DEPLOY_DIR}/app/app/api/fees/generate/route.ts"
try:
    sftp.put(local_fees, remote_fees)
    print("  [OK] Uploaded")
except Exception as e:
    print(f"  [!] Error: {e}")

# Rebuild
print("\n[5] Rebuilding Docker image...")
start = time.time()
stdin, stdout, stderr = ssh.exec_command(
    f"cd {DEPLOY_DIR}/app && docker build --no-cache -t expertos-web:latest . 2>&1 | tee /tmp/build.log | tail -30",
    timeout=900
)
output = stdout.read().decode('utf-8', errors='replace')
elapsed = int(time.time() - start)
print(f"  Build completed in {elapsed}s")

if "Successfully" in output:
    print("\n[OK] Docker image built!")
    
    # Start container
    print("\n[6] Starting container...")
    ssh.exec_command("docker stop expertos-web 2>/dev/null; docker rm expertos-web 2>/dev/null || true")
    time.sleep(3)
    stdin, stdout, stderr = ssh.exec_command(f"cd {DEPLOY_DIR} && docker-compose up -d 2>&1")
    print(stdout.read().decode('utf-8', errors='replace')[:300])
    print(stderr.read().decode('utf-8', errors='replace')[:300])
    
    # Wait and verify
    print("\n[7] Verifying (20s)...")
    time.sleep(20)
    
    stdin, stdout, stderr = ssh.exec_command("curl -s -m 10 -o /dev/null -w '%{http_code}' http://localhost:3001")
    code = stdout.read().decode('utf-8').strip()
    print(f"  HTTP Status: {code}")
    
    if code in ["200", "302", "307"]:
        print(f"\n{'='*60}")
        print("  SUCCESS! ExpertOS is RUNNING!")
        print(f"  URL: http://{SERVER_IP}:3001")
        print("="*60)
    else:
        print("\n[!] Checking logs...")
        stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | tail -15")
        logs = stdout.read().decode('utf-8', errors='replace')
        for line in logs.split('\n'):
            print(''.join(c if ord(c) < 128 else '?' for c in line))
else:
    print("\n[FAIL] Build failed")
    for line in output.split('\n'):
        if "error" in line.lower():
            print(''.join(c if ord(c) < 128 else '?' for c in line[:150]))

sftp.close()
ssh.close()
