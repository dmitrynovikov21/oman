#!/usr/bin/env python3
"""Fix container startup issue"""
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

# 1. Check why container failed
print("\n[1] Container logs from failed container:")
stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1")
logs = stdout.read().decode('utf-8', errors='replace')
print(logs[:2000] if logs else "(no logs)")

# 2. Check container inspect
print("\n[2] Container error state:")
stdin, stdout, stderr = ssh.exec_command("docker inspect expertos-web --format '{{.State.Status}} - {{.State.Error}}'")
print(stdout.read().decode('utf-8'))

# 3. Clean up and restart properly
print("\n[3] Cleaning up containers...")
ssh.exec_command("docker rm -f expertos-web 2>/dev/null")
ssh.exec_command("docker rm -f 37db29ed78a3_expertos-web 2>/dev/null")
time.sleep(2)

# 4. Check network
print("\n[4] Network setup:")
stdin, stdout, stderr = ssh.exec_command("docker network ls | grep expertos")
networks = stdout.read().decode('utf-8')
print(networks if networks else "  No expertos network found")

# Create network if needed
if not networks.strip():
    print("  Creating network...")
    ssh.exec_command("docker network create expertos_network")
    time.sleep(1)

# Ensure db is on network
print("  Connecting db to network...")
ssh.exec_command("docker network connect expertos_network expertos-db 2>/dev/null")

# 5. Start fresh container
print("\n[5] Starting container...")
run_cmd = '''docker run -d \
  --name expertos-web \
  --restart always \
  --network expertos_network \
  -p 3001:3000 \
  -e DATABASE_URL="postgresql://expertos:ExpertOS2026SecurePass@expertos-db:5432/expertos" \
  -e NEXTAUTH_URL="http://193.233.233.217:3001" \
  -e NEXTAUTH_SECRET="ExpertOS2026SuperSecretKey1234567890abcdefghij" \
  -e AUTH_SECRET="ExpertOS2026SuperSecretKey1234567890abcdefghij" \
  -e AUTH_TRUST_HOST="true" \
  -e NEXT_PUBLIC_APP_URL="http://193.233.233.217:3001" \
  -e NODE_ENV="production" \
  -v expertos_uploads_data:/app/public/uploads \
  expertos-web:latest'''

stdin, stdout, stderr = ssh.exec_command(run_cmd)
container_id = stdout.read().decode('utf-8').strip()
error = stderr.read().decode('utf-8')

if error:
    print(f"  Error: {error}")
else:
    print(f"  Started: {container_id[:12]}")

# Wait for startup
print("\n  Waiting 30s...")
time.sleep(30)

# 6. Check if running
print("\n[6] Checking container status:")
stdin, stdout, stderr = ssh.exec_command("docker ps --format 'table {{.Names}}\\t{{.Status}}' | grep expertos")
print(stdout.read().decode('utf-8'))

# 7. Check logs
print("\n[7] Container startup logs:")
stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | head -30")
print(stdout.read().decode('utf-8', errors='replace'))

# 8. Health check
print("\n[8] Health check:")
stdin, stdout, stderr = ssh.exec_command("curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/")
code = stdout.read().decode('utf-8').strip()
print(f"  HTTP: {code}")

if code == "200" or code == "302":
    print("  ✅ Service is UP!")
else:
    print("  ❌ Service not responding")
    print("\n  More logs:")
    stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | tail -30")
    print(stdout.read().decode('utf-8', errors='replace'))

print(f"\n  URL: http://193.233.233.217:3001")
ssh.close()
