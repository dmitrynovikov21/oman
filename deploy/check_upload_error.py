#!/usr/bin/env python3
"""Check production upload error"""
import subprocess, sys, os, time
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

print("\n" + "="*70)
print("PRODUCTION ERROR DIAGNOSTICS")
print("="*70)

# 1. Recent logs
print("\n[1] RECENT SERVER LOGS (last 50 lines):")
print("-"*50)
stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | tail -50")
print(stdout.read().decode('utf-8', errors='replace'))

# 2. Error logs specifically
print("\n[2] ERROR LOGS:")
print("-"*50)
stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | grep -iE 'error|fail|exception|internal' | tail -20")
print(stdout.read().decode('utf-8', errors='replace'))

# 3. Upload related logs
print("\n[3] UPLOAD RELATED LOGS:")
print("-"*50)
stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | grep -iE 'upload|document|file|ocr' | tail -15")
print(stdout.read().decode('utf-8', errors='replace'))

# 4. Check uploads folder permissions
print("\n[4] UPLOADS FOLDER:")
print("-"*50)
stdin, stdout, stderr = ssh.exec_command("docker exec expertos-web ls -la /app/public/uploads 2>&1 | head -10")
print(stdout.read().decode('utf-8'))

# 5. Check disk space
print("[5] DISK SPACE:")
stdin, stdout, stderr = ssh.exec_command("docker exec expertos-web df -h /app/public/uploads 2>&1")
print(stdout.read().decode('utf-8'))

# 6. Container status
print("[6] CONTAINER STATUS:")
stdin, stdout, stderr = ssh.exec_command("docker ps --format 'table {{.Names}}\\t{{.Status}}' | grep expertos")
print(stdout.read().decode('utf-8'))

ssh.close()
