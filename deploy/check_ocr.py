#!/usr/bin/env python3
"""Check OCR dependencies and file paths"""

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

# Check if pdf-parse is installed
print("\n" + "="*60)
print("  [1] Checking pdf-parse in node_modules")
print("="*60)
stdin, stdout, stderr = ssh.exec_command("docker exec expertos-web ls -la /app/node_modules/pdf-parse 2>&1 | head -5")
print(stdout.read().decode('utf-8'))

# Check package.json for pdf-parse
print("\n" + "="*60)
print("  [2] Checking package.json for pdf-parse")
print("="*60)
stdin, stdout, stderr = ssh.exec_command("docker exec expertos-web cat /app/package.json | grep -i pdf")
print(stdout.read().decode('utf-8'))

# Check uploads directory
print("\n" + "="*60)
print("  [3] Checking public/uploads in container")
print("="*60)
stdin, stdout, stderr = ssh.exec_command("docker exec expertos-web ls -la /app/public/uploads 2>&1 | head -10")
print(stdout.read().decode('utf-8'))

# Check recent logs for OCR errors
print("\n" + "="*60)
print("  [4] OCR-related errors in logs")
print("="*60)
stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | grep -iE '(ocr|pdf|parse|extract)' | tail -10")
print(stdout.read().decode('utf-8'))

# Test OCR API directly
print("\n" + "="*60)
print("  [5] Testing OCR API endpoint")
print("="*60)
stdin, stdout, stderr = ssh.exec_command('curl -s -X POST http://localhost:3001/api/ocr -H "Content-Type: application/json" -d \'{"documentId":"test123"}\' 2>&1')
print(stdout.read().decode('utf-8'))

# Check Finance page route
print("\n" + "="*60)
print("  [6] Checking Finance page exists")
print("="*60)
stdin, stdout, stderr = ssh.exec_command("docker exec expertos-web ls -la /app/app/\\(protected\\)/finance/ 2>&1")
print(stdout.read().decode('utf-8'))

# Check Settings page
print("\n" + "="*60)
print("  [7] Checking Settings/Admin pages")
print("="*60)
stdin, stdout, stderr = ssh.exec_command("docker exec expertos-web ls -la /app/app/\\(protected\\)/admin/ 2>&1")
print(stdout.read().decode('utf-8'))

ssh.close()
