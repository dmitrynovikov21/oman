#!/usr/bin/env python3
"""Upload all fixed files and do final build"""

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

# Files to upload with fixes
files_to_upload = [
    ("app/api/fees/generate/route.ts", "app/api/fees/generate/route.ts"),
    ("app/api/reports/generate/route.ts", "app/api/reports/generate/route.ts"),
    ("app/(protected)/analytics/page.tsx", "app/(protected)/analytics/page.tsx"),
]

print("[1/5] Uploading fixed files...")
for local_rel, remote_rel in files_to_upload:
    local_file = os.path.join(LOCAL_DIR, local_rel)
    remote_file = f"{DEPLOY_DIR}/app/{remote_rel}"
    if os.path.exists(local_file):
        print(f"  {local_rel}")
        try:
            sftp.put(local_file, remote_file)
        except Exception as e:
            print(f"    Error: {e}")

print("\n[2/5] Building Docker image...")
start = time.time()
stdin, stdout, stderr = ssh.exec_command(
    f"cd {DEPLOY_DIR}/app && docker build -t expertos-web:latest . 2>&1",
    timeout=900
)
output = stdout.read().decode('utf-8', errors='replace')
elapsed = int(time.time() - start)

# Save output
with open("final_build.log", "w", encoding="utf-8") as f:
    f.write(output)

# Check result
if "Successfully built" in output or "Successfully tagged" in output:
    print(f"[OK] Docker image built in {elapsed}s!")
else:
    print(f"[FAIL] Build failed after {elapsed}s")
    for line in output.split('\n'):
        if "error" in line.lower() or "Error" in line:
            clean = ''.join(c if ord(c) < 128 else '?' for c in line[:180])
            print(f"  {clean}")
    sftp.close()
    ssh.close()
    sys.exit(1)

# Start containers
print("\n[3/5] Starting containers...")
ssh.exec_command("docker stop expertos-web 2>/dev/null; docker rm expertos-web 2>/dev/null || true")
time.sleep(3)
stdin, stdout, stderr = ssh.exec_command(f"cd {DEPLOY_DIR} && docker-compose up -d 2>&1")
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
print(out[:300] if out else "")
print(err[:300] if err else "")

# Wait
print("\n[4/5] Waiting for startup (20s)...")
time.sleep(20)

# Verify
print("\n[5/5] Verification...")
stdin, stdout, stderr = ssh.exec_command(f"cd {DEPLOY_DIR} && docker-compose ps")
print(stdout.read().decode('utf-8', errors='replace'))

stdin, stdout, stderr = ssh.exec_command("curl -s -m 10 -o /dev/null -w '%{http_code}' http://localhost:3001")
code = stdout.read().decode('utf-8').strip()
print(f"\nHTTP Status: {code}")

if code in ["200", "302", "307"]:
    print("\n" + "="*60)
    print("  SUCCESS! ExpertOS is RUNNING!")
    print(f"  URL: http://{SERVER_IP}:3001")
    print("="*60)
else:
    print("\n[!] Getting logs...")
    stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | tail -15")
    logs = stdout.read().decode('utf-8', errors='replace')
    for line in logs.split('\n'):
        clean = ''.join(c if ord(c) < 128 else '?' for c in line)
        print(clean)

sftp.close()
ssh.close()
