#!/usr/bin/env python3
"""Debug documents in database"""

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

# 1. Check all tables
print("\n[1] Tables in database:")
stdin, stdout, stderr = ssh.exec_command('''docker exec expertos-db psql -U expertos -c "\\dt"''')
print(stdout.read().decode('utf-8'))

# 2. Count documents
print("[2] Document count:")
stdin, stdout, stderr = ssh.exec_command('''docker exec expertos-db psql -U expertos -c "SELECT COUNT(*) FROM \\\"Document\\\";"''')
print(stdout.read().decode('utf-8'))

# 3. List recent documents
print("[3] Recent documents:")
stdin, stdout, stderr = ssh.exec_command('''docker exec expertos-db psql -U expertos -c "SELECT id, name, \\\"filePath\\\", \\\"ocrStatus\\\" FROM \\\"Document\\\" ORDER BY \\\"createdAt\\\" DESC LIMIT 10;"''')
print(stdout.read().decode('utf-8'))

# 4. Check files in uploads folder
print("[4] Files in uploads folder:")
stdin, stdout, stderr = ssh.exec_command("docker exec expertos-web find /app/public/uploads -type f -name '*.pdf' 2>&1 | head -10")
pdfs = stdout.read().decode('utf-8')
print(pdfs if pdfs.strip() else "  (no PDF files found)")

# 5. Check upload volume mount
print("\n[5] Upload volume info:")
stdin, stdout, stderr = ssh.exec_command("docker exec expertos-web ls -la /app/public/uploads 2>&1 | head -10")
print(stdout.read().decode('utf-8'))

ssh.close()
