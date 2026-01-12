#!/usr/bin/env python3
"""Check tsconfig and wait for build"""
import subprocess, sys, os, time
os.environ["PYTHONIOENCODING"] = "utf-8"
try:
    import paramiko
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("193.233.233.217", username="root", password="3WP64PLwbT2Y", timeout=30)

# Check tsconfig.json
print("[1] Checking tsconfig.json paths...")
stdin, stdout, stderr = ssh.exec_command("cat /var/www/expertos/app/tsconfig.json | head -30")
print(stdout.read().decode('utf-8'))

# Wait and check logs
print("\n[2] Waiting 60 seconds for build...")
time.sleep(60)

# Get build logs
stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | tail -50")
logs = stdout.read().decode('utf-8', errors='replace')
with open("build_logs.txt", "w", encoding="utf-8") as f:
    f.write(logs)
print("Build logs saved to build_logs.txt")

# Check for success
if "ready" in logs.lower() or "started" in logs.lower():
    print("\n[SUCCESS] Application may be running!")
elif "error" in logs.lower():
    print("\n[ERROR] Build has errors, check build_logs.txt")
else:
    print("\n[BUILDING] Still building...")

# Curl test
stdin, stdout, stderr = ssh.exec_command("curl -s -m 5 -o /dev/null -w '%{http_code}' http://localhost:3001")
code = stdout.read().decode('utf-8').strip()
print(f"\nHTTP Status: {code}")

ssh.close()
