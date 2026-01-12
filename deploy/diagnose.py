#!/usr/bin/env python3
"""Diagnose production errors"""

import subprocess, sys, os
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

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS, timeout=30)
print("[+] Connected!")

# Check web container logs
print("\n" + "="*60)
print("  [1] Web Container Logs (last 50 lines)")
print("="*60)
stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | tail -50")
logs = stdout.read().decode('utf-8', errors='replace')
for line in logs.split('\n'):
    # Filter for errors and important messages
    if 'error' in line.lower() or 'Error' in line or 'warn' in line.lower() or 'ocr' in line.lower():
        print(line[:200])

# Check env vars inside container
print("\n" + "="*60)
print("  [2] Environment Variables in Container")
print("="*60)
stdin, stdout, stderr = ssh.exec_command("docker exec expertos-web env | grep -E '(AUTH|NEXT|DATABASE|NODE)'")
print(stdout.read().decode('utf-8'))

# Check if OCR endpoint exists
print("\n" + "="*60)
print("  [3] API Routes Structure")
print("="*60)
stdin, stdout, stderr = ssh.exec_command(f"ls -la {DEPLOY_DIR}/app/app/api/ | head -20")
print(stdout.read().decode('utf-8'))

# Check OCR route specifically
print("\n" + "="*60)
print("  [4] OCR API Route")
print("="*60)
stdin, stdout, stderr = ssh.exec_command(f"ls -la {DEPLOY_DIR}/app/app/api/ocr/ 2>&1")
print(stdout.read().decode('utf-8'))

# Check if backend folder exists for Python OCR
print("\n" + "="*60)
print("  [5] Backend Folder (Python OCR)")
print("="*60)
stdin, stdout, stderr = ssh.exec_command(f"ls -la {DEPLOY_DIR}/app/backend/ 2>&1 | head -15")
print(stdout.read().decode('utf-8'))

# Check .env file in built container
print("\n" + "="*60)
print("  [6] .env in Container /app")
print("="*60)
stdin, stdout, stderr = ssh.exec_command("docker exec expertos-web cat /app/.env 2>&1")
print(stdout.read().decode('utf-8'))

# Check auth configuration
print("\n" + "="*60)
print("  [7] Auth.ts Search for AUTH_SECRET usage")
print("="*60)
stdin, stdout, stderr = ssh.exec_command(f"grep -r 'AUTH_SECRET' {DEPLOY_DIR}/app/app/ --include='*.ts' 2>&1 | head -10")
print(stdout.read().decode('utf-8'))

# Check env.mjs for required variables
print("\n" + "="*60)
print("  [8] env.mjs - Required Variables")
print("="*60)
stdin, stdout, stderr = ssh.exec_command(f"cat {DEPLOY_DIR}/app/env.mjs 2>&1 | head -40")
print(stdout.read().decode('utf-8'))

ssh.close()
