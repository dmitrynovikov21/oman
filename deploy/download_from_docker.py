#!/usr/bin/env python3
"""Download image from Docker container"""
import subprocess, sys, os
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
try:
    import paramiko
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("193.233.233.217", username="root", password="3WP64PLwbT2Y", timeout=30)
sftp = ssh.open_sftp()
print("[+] Connected!")

# Convert PDF to image INSIDE Docker container
print("\n[1] Converting PDF to image inside Docker container...")
stdin, stdout, stderr = ssh.exec_command(
    '''docker exec expertos-web sh -c "pdftoppm -png -r 300 -f 1 -l 1 /app/public/uploads/ocr_test_case/test_arabic.pdf /tmp/page 2>&1 && ls -la /tmp/page*"''',
    timeout=60
)
print(stdout.read().decode('utf-8', errors='replace'))
print(stderr.read().decode('utf-8', errors='replace'))

# Copy from container to host
print("\n[2] Copying from container to host...")
stdin, stdout, stderr = ssh.exec_command("docker cp expertos-web:/tmp/page-1.png /tmp/page-1.png 2>&1")
print(stdout.read().decode('utf-8', errors='replace'))

# Check file
stdin, stdout, stderr = ssh.exec_command("ls -la /tmp/page-1.png")
print(stdout.read().decode('utf-8'))

# Download to local
print("\n[3] Downloading to local...")
local_path = r"c:\gravity\gravity\expertos\deploy\test_page_1.png"
try:
    sftp.get("/tmp/page-1.png", local_path)
    print(f"  Downloaded to: {local_path}")
    print(f"  Size: {os.path.getsize(local_path)} bytes")
except Exception as e:
    print(f"  Error: {e}")

sftp.close()
ssh.close()
