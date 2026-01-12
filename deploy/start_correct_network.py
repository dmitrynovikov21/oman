#!/usr/bin/env python3
"""Start container with correct network"""
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

# Clean up
print("\n[1] Cleaning up old containers...")
ssh.exec_command("docker rm -f expertos-web 2>/dev/null")
time.sleep(2)

# Start with correct network name: expertos_default
print("\n[2] Starting container with expertos_default network...")
run_cmd = '''docker run -d \
  --name expertos-web \
  --restart always \
  --network expertos_default \
  -p 3001:3000 \
  -e DATABASE_URL="postgresql://expertos:ExpertOS2026SecurePass@db:5432/expertos" \
  -e NEXTAUTH_URL="http://193.233.233.217:3001" \
  -e NEXTAUTH_SECRET="ExpertOS2026SuperSecretKey1234567890abcdefghij" \
  -e AUTH_SECRET="ExpertOS2026SuperSecretKey1234567890abcdefghij" \
  -e AUTH_TRUST_HOST="true" \
  -e NEXT_PUBLIC_APP_URL="http://193.233.233.217:3001" \
  -e NODE_ENV="production" \
  -v expertos_uploads_data:/app/public/uploads \
  expertos-web:latest 2>&1'''

stdin, stdout, stderr = ssh.exec_command(run_cmd)
output = stdout.read().decode('utf-8')
print(f"  Result: {output[:80]}")

print("\n  Waiting 35s for startup...")
time.sleep(35)

# Check status
print("\n[3] Container status:")
stdin, stdout, stderr = ssh.exec_command("docker ps --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}' | grep expertos")
print(stdout.read().decode('utf-8'))

# Check logs
print("\n[4] Startup logs:")
stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | head -20")
logs = stdout.read().decode('utf-8', errors='replace')
print(logs if logs else "(no logs)")

# Health check
print("\n[5] Health check:")
stdin, stdout, stderr = ssh.exec_command("curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/")
code = stdout.read().decode('utf-8').strip()
print(f"  Root: HTTP {code}")

stdin, stdout, stderr = ssh.exec_command("curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/dashboard")
code2 = stdout.read().decode('utf-8').strip()
print(f"  Dashboard: HTTP {code2}")

if code == "200" or code == "302" or code2 == "200":
    print("\n  ✅ Service is UP!")
    
    # Quick API test
    print("\n[6] Quick API tests:")
    stdin, stdout, stderr = ssh.exec_command("curl -s http://localhost:3001/api/cases 2>&1 | head -c 200")
    print(f"  Cases API: {stdout.read().decode('utf-8', errors='replace')[:150]}")
else:
    print("\n  ❌ Service not responding")
    print("\n  Container logs:")
    stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | tail -40")
    print(stdout.read().decode('utf-8', errors='replace'))

print(f"\n  URL: http://193.233.233.217:3001")
ssh.close()
