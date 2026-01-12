#!/usr/bin/env python3
"""Final rebuild with all fixes"""

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

# Upload both fixed files
print("[1/5] Uploading fixed route files...")
files_to_upload = [
    ("app/api/fees/generate/route.ts", "app/api/fees/generate/route.ts"),
    ("app/api/reports/generate/route.ts", "app/api/reports/generate/route.ts"),
]

for local_rel, remote_rel in files_to_upload:
    local_file = os.path.join(LOCAL_DIR, local_rel)
    remote_file = f"{DEPLOY_DIR}/app/{remote_rel}"
    print(f"  Uploading {local_rel}...")
    try:
        sftp.put(local_file, remote_file)
    except Exception as e:
        print(f"    Error: {e}")

print("  Done")

# Build
print("\n[2/5] Building Docker image (this takes 5-10 minutes)...")
start = time.time()
stdin, stdout, stderr = ssh.exec_command(
    f"cd {DEPLOY_DIR}/app && docker build -t expertos-web:latest . 2>&1",
    timeout=900
)
output = stdout.read().decode('utf-8', errors='replace')
elapsed = int(time.time() - start)
print(f"  Build completed in {elapsed}s")

# Save full output
with open("final_build.log", "w", encoding="utf-8") as f:
    f.write(output)

# Check result
if "Successfully" in output:
    print("[OK] Docker image built successfully!")
else:
    print("[FAIL] Build failed.")
    # Find errors
    for line in output.split('\n'):
        if "error" in line.lower() or "Error" in line:
            clean = ''.join(c if ord(c) < 128 else '?' for c in line[:150])
            print(f"  {clean}")
    sftp.close()
    ssh.close()
    sys.exit(1)

# Start
print("\n[3/5] Starting containers...")
ssh.exec_command("docker stop expertos-web 2>/dev/null; docker rm expertos-web 2>/dev/null || true")
time.sleep(3)
stdin, stdout, stderr = ssh.exec_command(f"cd {DEPLOY_DIR} && docker-compose up -d 2>&1")
out = stdout.read().decode('utf-8')
err = stderr.read().decode('utf-8')
print(out[:500] if out else "")
print(err[:500] if err else "")

# Wait for startup
print("\n[4/5] Waiting for startup (15s)...")
time.sleep(15)

# Verify
print("\n[5/5] Verification...")
stdin, stdout, stderr = ssh.exec_command(f"cd {DEPLOY_DIR} && docker-compose ps")
print(stdout.read().decode('utf-8'))

stdin, stdout, stderr = ssh.exec_command("curl -s -m 10 -o /dev/null -w '%{http_code}' http://localhost:3001")
code = stdout.read().decode('utf-8').strip()
print(f"HTTP Status: {code}")

if code in ["200", "302", "307"]:
    print("\n" + "="*60)
    print(f"  SUCCESS! ExpertOS is RUNNING!")
    print(f"  URL: http://{SERVER_IP}:3001")
    print("="*60)
else:
    print("\n[!] Container logs:")
    stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | tail -20")
    logs = stdout.read().decode('utf-8', errors='replace')
    for line in logs.split('\n'):
        clean = ''.join(c if ord(c) < 128 else '?' for c in line)
        print(clean)

sftp.close()
ssh.close()
