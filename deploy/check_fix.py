#!/usr/bin/env python3
"""Check if the space normalization fix is present in route.ts on server"""
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

# Check the post-processing code in route.ts
print("\n[1] Checking post-processing code in route.ts...")
stdin, stdout, stderr = ssh.exec_command('grep -n "CLEAN UP NOISE" -A5 /var/www/expertos/app/app/api/ocr/route.ts', timeout=30)
result = stdout.read().decode('utf-8', errors='replace')
print(result)

print("\n[2] Checking if space normalization regex is present...")
stdin, stdout, stderr = ssh.exec_command('grep -n "  +" /var/www/expertos/app/app/api/ocr/route.ts', timeout=30)
result = stdout.read().decode('utf-8', errors='replace')
if result:
    print(f"  ✅ Found: {result}")
else:
    print("  ❌ NOT FOUND - the fix is missing!")
    
    # Check what's there instead
    print("\n[3] Checking current whitespace handling...")
    stdin, stdout, stderr = ssh.exec_command('grep -n "whitespace\\|\\\\s" /var/www/expertos/app/app/api/ocr/route.ts', timeout=30)
    print(stdout.read().decode('utf-8'))

# Check if the file was recently modified
print("\n[4] File modification time...")
stdin, stdout, stderr = ssh.exec_command('ls -la /var/www/expertos/app/app/api/ocr/route.ts', timeout=30)
print(stdout.read().decode('utf-8'))

ssh.close()
