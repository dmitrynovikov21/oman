#!/usr/bin/env python3
"""Get full webpack errors"""
import subprocess, sys, os
os.environ["PYTHONIOENCODING"] = "utf-8"
try:
    import paramiko
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("193.233.233.217", username="root", password="3WP64PLwbT2Y", timeout=30)

# Get full logs and save to file
print("Getting full build logs...")
stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1")
logs = stdout.read().decode('utf-8', errors='replace')

with open("full_logs.txt", "w", encoding="utf-8") as f:
    f.write(logs)
    
print(f"Full logs saved to full_logs.txt ({len(logs)} bytes)")

# Extract webpack errors
lines = logs.split('\n')
error_start = False
for i, line in enumerate(lines):
    if "Module not found" in line or "Failed to compile" in line:
        error_start = True
        print(f"\n=== Error at line {i} ===")
    if error_start:
        print(line)
        if line.startswith(">") or "webpack" in line.lower():
            error_start = False

# Check if lib/utils exists
print("\n\n=== Checking lib/utils.ts ===")
stdin, stdout, stderr = ssh.exec_command("ls -la /var/www/expertos/app/lib/ 2>&1")
print(stdout.read().decode('utf-8'))

# Check tsconfig baseUrl
print("\n=== Checking tsconfig baseUrl ===")
stdin, stdout, stderr = ssh.exec_command('cat /var/www/expertos/app/tsconfig.json | grep -A2 "baseUrl"')
print(stdout.read().decode('utf-8'))

ssh.close()
