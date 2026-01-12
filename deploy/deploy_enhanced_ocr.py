#!/usr/bin/env python3
"""
Deploy Enhanced OCR Service to Production
Uploads all modules and builds Docker container
"""
import subprocess, sys, time, os
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
try:
    import paramiko
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko

SERVER = "193.233.233.217"
USER = "root"
PASSWORD = "3WP64PLwbT2Y"
REMOTE_DIR = "/var/www/expertos/app/backend"

# Files to upload
FILES = [
    "backend/opencv_preprocessor.py",
    "backend/ensemble_ocr.py",
    "backend/enhanced_ocr_service.py",
    "backend/Dockerfile.enhanced_ocr",
]

def connect():
    for attempt in range(3):
        try:
            print(f"[{attempt+1}/3] Connecting...")
            ssh = paramiko.SSHClient()
            ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            ssh.connect(SERVER, username=USER, password=PASSWORD, timeout=60, banner_timeout=60)
            print("[OK] Connected!")
            return ssh
        except Exception as e:
            print(f"  Error: {e}")
            time.sleep(5)
    return None

ssh = connect()
if not ssh:
    print("[FAIL] Could not connect")
    sys.exit(1)

sftp = ssh.open_sftp()

# 1. Create backend directory if not exists
print("\n[1/4] Creating backend directory...")
ssh.exec_command(f"mkdir -p {REMOTE_DIR}", timeout=30)
print("  [OK]")

# 2. Upload files
print("\n[2/4] Uploading files...")
for local_file in FILES:
    if os.path.exists(local_file):
        remote_file = f"{REMOTE_DIR}/{os.path.basename(local_file)}"
        try:
            sftp.put(local_file, remote_file)
            print(f"  [OK] {os.path.basename(local_file)}")
        except Exception as e:
            print(f"  [FAIL] {os.path.basename(local_file)}: {e}")
    else:
        print(f"  [SKIP] {local_file} not found")

# 3. Build Docker image (may take 10+ minutes for first build)
print("\n[3/4] Building Docker image (this may take 10+ minutes)...")
print("  Note: First build downloads ~2GB of models")

build_cmd = f"cd {REMOTE_DIR} && docker build -f Dockerfile.enhanced_ocr -t enhanced-ocr:latest . 2>&1 | tail -20"
stdin, stdout, stderr = ssh.exec_command(build_cmd, timeout=1200)
output = stdout.read().decode('utf-8', errors='replace')
print(output)

if "Successfully built" in output or "Successfully tagged" in output:
    print("  [OK] Build successful!")
    
    # 4. Run container
    print("\n[4/4] Starting container...")
    
    # Stop existing container
    ssh.exec_command("docker stop enhanced-ocr 2>/dev/null; docker rm enhanced-ocr 2>/dev/null", timeout=30)
    time.sleep(2)
    
    # Run new container
    run_cmd = """docker run -d --name enhanced-ocr --restart always \
        --network expertos_default \
        -p 5001:5001 \
        enhanced-ocr:latest"""
    
    stdin, stdout, stderr = ssh.exec_command(run_cmd, timeout=30)
    time.sleep(5)
    
    # Check status
    stdin, stdout, stderr = ssh.exec_command("docker ps -f name=enhanced-ocr --format '{{.Status}}'", timeout=30)
    status = stdout.read().decode().strip()
    print(f"  Container status: {status}")
    
    # Test health endpoint
    time.sleep(30)
    print("\n[5/5] Testing health endpoint...")
    stdin, stdout, stderr = ssh.exec_command("curl -s http://localhost:5001/health", timeout=30)
    health = stdout.read().decode()
    print(f"  Response: {health}")
    
    print("\n" + "="*60)
    print("DEPLOYMENT COMPLETE!")
    print("Enhanced OCR service running on port 5001")
    print("="*60)
else:
    print("  [FAIL] Build failed")
    # Try to get error
    stdin, stdout, stderr = ssh.exec_command("cat /var/log/docker-build.log 2>/dev/null | tail -30", timeout=30)
    print(stderr.read().decode())

sftp.close()
ssh.close()
