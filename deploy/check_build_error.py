#!/usr/bin/env python3
"""Check build error details"""
import subprocess, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
try:
    import paramiko
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("193.233.233.217", username="root", password="3WP64PLwbT2Y", timeout=60, banner_timeout=60)
print("[+] Connected!")

# Check build log in detail
print("\n[1] Checking last build output...")
stdin, stdout, stderr = ssh.exec_command(
    "cd /var/www/expertos/app && docker build -t expertos-web:latest . 2>&1 | grep -A5 'npm run build' | head -30",
    timeout=300
)
output = stdout.read().decode('utf-8', errors='replace')
print(output)

# Check if there's an issue with the OCR file
print("\n[2] Checking OCR file on server...")
stdin, stdout, stderr = ssh.exec_command("head -20 /var/www/expertos/app/app/api/ocr/route.ts")
print(stdout.read().decode('utf-8'))

# Check TypeScript errors
print("\n[3] Running quick TypeScript check...")
stdin, stdout, stderr = ssh.exec_command(
    "cd /var/www/expertos/app && npx tsc app/api/ocr/route.ts --noEmit 2>&1 | head -20",
    timeout=60
)
print(stdout.read().decode('utf-8'))

ssh.close()
