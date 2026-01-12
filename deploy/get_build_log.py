#!/usr/bin/env python3
"""Get full build log and find the actual error location"""

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

# Get full build log from server
print("\n[1] Getting build log from server...")
stdin, stdout, stderr = ssh.exec_command("cat /tmp/build.log | tail -100")
output = stdout.read().decode('utf-8', errors='replace')

# Save to file
with open("server_build.log", "w", encoding="utf-8") as f:
    f.write(output)

print(f"Saved to server_build.log ({len(output)} chars)")

# Find error context
print("\n[2] Finding error context...")
lines = output.split('\n')
for i, line in enumerate(lines):
    if "never" in line.lower() or "Type error" in line:
        # Print context
        start = max(0, i-5)
        end = min(len(lines), i+3)
        print(f"\n=== Error around line {i} ===")
        for j in range(start, end):
            clean = ''.join(c if ord(c) < 128 else '?' for c in lines[j])
            print(f"  {j}: {clean}")

# Check if there's another file with the issue
print("\n[3] Searching for problem files...")
stdin, stdout, stderr = ssh.exec_command("cat /tmp/build.log | grep -B5 'never' | head -20")
context = stdout.read().decode('utf-8', errors='replace')
print(context)

ssh.close()
