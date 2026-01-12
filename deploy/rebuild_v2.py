#!/usr/bin/env python3
"""Rebuild with proper encoding"""

import subprocess, sys, os, time
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

# Build image and save to file
print("\n[1/3] Building Docker image...")
print("      Running: docker build -t expertos-web:latest . (5-10 min)")

stdin, stdout, stderr = ssh.exec_command(
    f"cd {DEPLOY_DIR}/app && docker build -t expertos-web:latest . 2>&1 | tee /tmp/build.log | tail -50",
    timeout=900
)
# Read and save without printing
output = stdout.read().decode('utf-8', errors='replace')

# Save to local file
with open("docker_build.log", "w", encoding="utf-8") as f:
    f.write(output)
print(f"Build output saved to docker_build.log ({len(output)} chars)")

# Check for success/failure
if "Successfully" in output:
    print("[OK] Docker image built successfully!")
elif "Build failed" in output or "error" in output.lower():
    print("[FAIL] Build failed. Check docker_build.log")
    # Get more of the error
    stdin, stdout, stderr = ssh.exec_command("cat /tmp/build.log | grep -E '(Module not found|error|Error)' | tail -20")
    errors = stdout.read().decode('utf-8', errors='replace')
    print("Errors found:")
    print(errors)
    ssh.close()
    sys.exit(1)

# Start container
print("\n[2/3] Starting container...")
stdin, stdout, stderr = ssh.exec_command("docker stop expertos-web 2>/dev/null; docker rm expertos-web 2>/dev/null || true")
stdout.read()

stdin, stdout, stderr = ssh.exec_command(f"cd {DEPLOY_DIR} && docker-compose up -d web 2>&1")
print(stdout.read().decode('utf-8', errors='replace'))
print(stderr.read().decode('utf-8', errors='replace'))

# Wait
print("\n[3/3] Waiting for startup...")
time.sleep(15)

# Check status
stdin, stdout, stderr = ssh.exec_command(f"cd {DEPLOY_DIR} && docker-compose ps")
print(stdout.read().decode('utf-8', errors='replace'))

# Test HTTP
stdin, stdout, stderr = ssh.exec_command("curl -s -m 10 -o /dev/null -w '%{http_code}' http://localhost:3001")
code = stdout.read().decode('utf-8').strip()
print(f"\nHTTP Status: {code}")

if code in ["200", "302", "307"]:
    print(f"\n=== SUCCESS! ExpertOS running at http://{SERVER_IP}:3001 ===")
else:
    print("\n[!] App not responding. Checking logs...")
    stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | tail -20")
    logs = stdout.read().decode('utf-8', errors='replace')
    with open("container_logs.txt", "w", encoding="utf-8") as f:
        f.write(logs)
    print("Logs saved to container_logs.txt")

ssh.close()
