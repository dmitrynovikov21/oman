#!/usr/bin/env python3
"""Upload assets and rebuild"""

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

def upload_directory(sftp, local_dir, remote_dir):
    try:
        sftp.mkdir(remote_dir)
    except:
        pass
    
    count = 0
    for item in os.listdir(local_dir):
        local_path = os.path.join(local_dir, item)
        remote_path = f"{remote_dir}/{item}"
        
        if item in ['node_modules', '.next', '.git', '__pycache__']:
            continue
            
        if os.path.isfile(local_path):
            try:
                sftp.put(local_path, remote_path)
                count += 1
            except:
                pass
        elif os.path.isdir(local_path):
            count += upload_directory(sftp, local_path, remote_path)
    
    return count

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS, timeout=30)
sftp = ssh.open_sftp()
print("[+] Connected!")

# Upload assets
print("\n[1/4] Uploading assets/...")
local_assets = os.path.join(LOCAL_DIR, "assets")
remote_assets = f"{DEPLOY_DIR}/app/assets"
count = upload_directory(sftp, local_assets, remote_assets)
print(f"  -> {count} files")

# Verify
stdin, stdout, stderr = ssh.exec_command(f"ls -la {DEPLOY_DIR}/app/assets/")
print(stdout.read().decode('utf-8'))

# Build
print("\n[2/4] Rebuilding Docker image...")
stdin, stdout, stderr = ssh.exec_command(
    f"cd {DEPLOY_DIR}/app && docker build -t expertos-web:latest . 2>&1 | tee /tmp/build.log | tail -30",
    timeout=900
)
output = stdout.read().decode('utf-8', errors='replace')
with open("docker_build.log", "w", encoding="utf-8") as f:
    f.write(output)
print(f"Build output saved (last part):")
# Print clean version
for line in output.split('\n')[-15:]:
    clean = ''.join(c if ord(c) < 128 else '?' for c in line)
    print(clean)

if "Successfully" in output:
    print("\n[OK] Docker image built!")
else:
    print("\n[!] Checking for errors...")
    stdin, stdout, stderr = ssh.exec_command("cat /tmp/build.log | grep -E '(Module not found|error:|Error:)' | tail -10")
    print(stdout.read().decode('utf-8', errors='replace'))
    sftp.close()
    ssh.close()
    sys.exit(1)

# Start
print("\n[3/4] Starting container...")
ssh.exec_command("docker stop expertos-web 2>/dev/null; docker rm expertos-web 2>/dev/null || true")
time.sleep(2)
stdin, stdout, stderr = ssh.exec_command(f"cd {DEPLOY_DIR} && docker-compose up -d web 2>&1")
print(stdout.read().decode('utf-8', errors='replace'))
print(stderr.read().decode('utf-8', errors='replace'))

# Verify
print("\n[4/4] Verifying...")
time.sleep(15)
stdin, stdout, stderr = ssh.exec_command("curl -s -m 10 -o /dev/null -w '%{http_code}' http://localhost:3001")
code = stdout.read().decode('utf-8').strip()
print(f"HTTP Status: {code}")

if code in ["200", "302", "307"]:
    print(f"\n=== SUCCESS! http://{SERVER_IP}:3001 ===")

sftp.close()
ssh.close()
