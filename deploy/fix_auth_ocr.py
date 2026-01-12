#!/usr/bin/env python3
"""Fix Auth and upload OCR backend"""

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
        
        if item in ['node_modules', '.next', '.git', '__pycache__', '.pytest_cache']:
            continue
            
        if os.path.isfile(local_path):
            try:
                sftp.put(local_path, remote_path)
                count += 1
            except Exception as e:
                print(f"    [!] {item}: {e}")
        elif os.path.isdir(local_path):
            count += upload_directory(sftp, local_path, remote_path)
    
    return count

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS, timeout=30)
sftp = ssh.open_sftp()
print("[+] Connected!")

# Fix 1: Update .env with AUTH_TRUST_HOST
print("\n[1/5] Fixing .env with AUTH_TRUST_HOST...")
env_content = """DATABASE_URL="postgresql://expertos:ExpertOS2026SecurePass@db:5432/expertos"
NEXTAUTH_URL="http://193.233.233.217:3001"
NEXTAUTH_SECRET="ExpertOS2026SuperSecretKey1234567890abcdefghij"
AUTH_SECRET="ExpertOS2026SuperSecretKey1234567890abcdefghij"
AUTH_TRUST_HOST="true"
NEXT_PUBLIC_APP_URL="http://193.233.233.217:3001"
NODE_ENV="production"
"""
# Write via sftp
env_path = f"{DEPLOY_DIR}/app/.env"
with sftp.open(env_path, 'w') as f:
    f.write(env_content)
print("  [OK] .env updated with AUTH_TRUST_HOST=true")

# Fix 2: Upload backend folder
print("\n[2/5] Uploading backend/ folder for OCR...")
local_backend = os.path.join(LOCAL_DIR, "backend")
remote_backend = f"{DEPLOY_DIR}/app/backend"
if os.path.exists(local_backend):
    count = upload_directory(sftp, local_backend, remote_backend)
    print(f"  [OK] Uploaded {count} files to backend/")
else:
    print(f"  [!] backend/ not found locally at {local_backend}")

# Verify
stdin, stdout, stderr = ssh.exec_command(f"ls {DEPLOY_DIR}/app/backend/ | head -10")
print(f"  Backend files: {stdout.read().decode('utf-8')}")

# Fix auth.ts - add trustHost: true
print("\n[3/5] Patching auth.ts with trustHost: true...")
# First check if auth.ts exists
stdin, stdout, stderr = ssh.exec_command(f"cat {DEPLOY_DIR}/app/auth.ts | head -20")
auth_content = stdout.read().decode('utf-8')

if "trustHost" not in auth_content:
    # Add trustHost after NextAuth({
    patch_cmd = f"sed -i 's/NextAuth({{/NextAuth({{\\n  trustHost: true,/' {DEPLOY_DIR}/app/auth.ts"
    stdin, stdout, stderr = ssh.exec_command(patch_cmd)
    print("  [OK] Added trustHost: true to auth.ts")
else:
    print("  [SKIP] trustHost already present")

# Rebuild Docker image  
print("\n[4/5] Rebuilding Docker image...")
start = time.time()
stdin, stdout, stderr = ssh.exec_command(
    f"cd {DEPLOY_DIR}/app && docker build -t expertos-web:latest . 2>&1",
    timeout=900
)
output = stdout.read().decode('utf-8', errors='replace')
elapsed = int(time.time() - start)
print(f"  Build completed in {elapsed}s")

if "Successfully" in output:
    print("  [OK] Docker image built!")
    
    # Restart container
    print("\n[5/5] Restarting container...")
    ssh.exec_command("docker stop expertos-web 2>/dev/null; docker rm expertos-web 2>/dev/null || true")
    time.sleep(3)
    stdin, stdout, stderr = ssh.exec_command(f"cd {DEPLOY_DIR} && docker-compose up -d 2>&1")
    print(stdout.read().decode('utf-8', errors='replace')[:300])
    
    # Wait and verify
    print("\n  Waiting 30s for startup...")
    time.sleep(30)
    
    stdin, stdout, stderr = ssh.exec_command("curl -s -m 10 -o /dev/null -w '%{http_code}' http://localhost:3001")
    code = stdout.read().decode('utf-8').strip()
    print(f"  HTTP Status: {code}")
    
    # Check auth errors
    stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | grep -i 'UntrustedHost' | tail -3")
    errors = stdout.read().decode('utf-8', errors='replace')
    if errors:
        print(f"\n  UntrustedHost errors still present:\n{errors}")
    else:
        print("\n  [OK] No UntrustedHost errors!")
else:
    print(f"  [FAIL] Build failed")
    for line in output.split('\n')[-20:]:
        clean = ''.join(c if ord(c) < 128 else '?' for c in line)
        if clean.strip():
            print(clean[:150])

sftp.close()
ssh.close()
