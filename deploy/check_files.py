#!/usr/bin/env python3
"""Check uploads and DB sync"""
import subprocess, sys, os
os.environ["PYTHONIOENCODING"] = "utf-8"
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
try:
    import paramiko
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("193.233.233.217", username="root", password="3WP64PLwbT2Y", timeout=30)
print("[+] Connected!")

# 1. Check actual files in uploads
print("\n[1] Actual PDF files in container uploads:")
stdin, stdout, stderr = ssh.exec_command("docker exec expertos-web find /app/public/uploads -name '*.pdf' 2>&1")
files = stdout.read().decode('utf-8', errors='replace')
print(files if files.strip() else "  (no PDF files found)")

# 2. Check uploads volume
print("\n[2] Docker volumes:")
stdin, stdout, stderr = ssh.exec_command("docker volume ls | grep expertos")
print(stdout.read().decode('utf-8'))

# 3. Check volume mounts
print("[3] Volume mounts for expertos-web:")
stdin, stdout, stderr = ssh.exec_command("docker inspect expertos-web --format '{{json .Mounts}}' 2>&1 | python3 -m json.tool")
print(stdout.read().decode('utf-8', errors='replace')[:500])

# 4. Check DB documents with file paths
print("\n[4] Documents in DB:")
stdin, stdout, stderr = ssh.exec_command('docker exec expertos-db psql -U expertos -c "SELECT id, name, file_path FROM documents LIMIT 5;"')
print(stdout.read().decode('utf-8'))

# 5. Check if ANY uploads folder has files
print("[5] All items in /app/public/uploads:")
stdin, stdout, stderr = ssh.exec_command("docker exec expertos-web ls -la /app/public/uploads/ 2>&1 | head -15")
print(stdout.read().decode('utf-8'))

ssh.close()
