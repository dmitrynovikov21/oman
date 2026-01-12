#!/usr/bin/env python3
"""Force fresh build and wait for completion"""
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

print("[1] Stopping and removing web container...")
stdin, stdout, stderr = ssh.exec_command("docker stop expertos-web; docker rm expertos-web 2>/dev/null || true")
print(stdout.read().decode('utf-8'))
time.sleep(3)

print("[2] Clearing node_modules volume...")
stdin, stdout, stderr = ssh.exec_command("docker volume rm expertos_app_node_modules 2>/dev/null || true")
print(stdout.read().decode('utf-8'))

print("[3] Starting fresh build...")
stdin, stdout, stderr = ssh.exec_command("cd /var/www/expertos && docker-compose up -d web")
err = stderr.read().decode('utf-8', errors='replace')
out = stdout.read().decode('utf-8', errors='replace')
print(out)
print(err)

print("\n[4] Waiting 120 seconds for npm install + prisma + build...")
for i in range(12):
    time.sleep(10)
    print(f"  {(i+1)*10}s...", end=" ", flush=True)
print()

print("\n[5] Checking container status...")
stdin, stdout, stderr = ssh.exec_command("cd /var/www/expertos && docker-compose ps")
print(stdout.read().decode('utf-8'))

print("\n[6] Checking if app responds...")
stdin, stdout, stderr = ssh.exec_command("curl -s -m 5 -o /dev/null -w '%{http_code}' http://localhost:3001")
code = stdout.read().decode('utf-8').strip()
print(f"HTTP Status: {code}")

if code == "200" or code == "302":
    print("\n=== SUCCESS! ExpertOS is running! ===")
    print(f"URL: http://193.233.233.217:3001")
else:
    print("\n[7] Checking logs for errors...")
    stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | grep -E '(error|Error|ready|started|listening)' | tail -20")
    logs = stdout.read().decode('utf-8', errors='replace')
    print(logs)

ssh.close()
