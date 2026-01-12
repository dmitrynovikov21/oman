#!/usr/bin/env python3
"""Find exact file with 'never' type error"""

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

# Get full context around 'never' error
print("\n[1] Getting full error context...")
stdin, stdout, stderr = ssh.exec_command("cat /tmp/build.log | grep -B20 'never' | head -30")
output = stdout.read().decode('utf-8', errors='replace')
print(output)

# Get more context
print("\n[2] Getting lines before 'Argument of type'...")
stdin, stdout, stderr = ssh.exec_command("cat /tmp/build.log | grep -B10 'Argument of type' | head -15")
output = stdout.read().decode('utf-8', errors='replace')
print(output)

# Check which file it's in
print("\n[3] Looking for file path...")
stdin, stdout, stderr = ssh.exec_command("cat /tmp/build.log | grep -E '^(./|app/).*\\.tsx?' | tail -20")
output = stdout.read().decode('utf-8', errors='replace')
print(output)

ssh.close()
