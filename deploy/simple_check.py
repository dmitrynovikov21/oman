#!/usr/bin/env python3
"""Simple log checker"""
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

# Get raw logs and save to file
stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | tail -100", timeout=60)
logs = stdout.read().decode('utf-8', errors='replace')

# Write to file 
with open("server_logs.txt", "w", encoding="utf-8") as f:
    f.write(logs)

print(f"Logs saved to server_logs.txt ({len(logs)} chars)")

# Check for key patterns
patterns = ["error", "Error", "ERROR", "ready", "started", "listening", "build", "ENOENT"]
for p in patterns:
    count = logs.lower().count(p.lower())
    if count > 0:
        print(f"  Found '{p}': {count} times")

# Container status
stdin, stdout, stderr = ssh.exec_command("cd /var/www/expertos && docker-compose ps", timeout=30)
print("\nContainer status:")
print(stdout.read().decode('utf-8', errors='replace'))

# Port check
stdin, stdout, stderr = ssh.exec_command("ss -tlnp | grep 3001", timeout=30)
print("Port 3001:")
print(stdout.read().decode('utf-8', errors='replace'))

# Curl test
stdin, stdout, stderr = ssh.exec_command("curl -s -m 5 http://localhost:3001 | head -c 200", timeout=30)
print("Curl localhost:3001:")
print(stdout.read().decode('utf-8', errors='replace') or "No response")

ssh.close()
