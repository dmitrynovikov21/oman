#!/usr/bin/env python3
"""Add missing env vars and rebuild"""

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

# Update .env with all required variables
print("\n[1/5] Creating complete .env file...")

env_content = f'''DATABASE_URL="postgresql://expertos:ExpertOS2026SecurePass@db:5432/expertos"
NEXTAUTH_URL="http://{SERVER_IP}:3001"
NEXTAUTH_SECRET="ExpertOS2026SuperSecretKey1234567890abcdefghij"
AUTH_SECRET="ExpertOS2026SuperSecretKey1234567890abcdefghij"
NEXT_PUBLIC_APP_URL="http://{SERVER_IP}:3001"
NODE_ENV="production"
'''

stdin, stdout, stderr = ssh.exec_command(f"cat > {DEPLOY_DIR}/app/.env << 'ENVEOF'\n{env_content}\nENVEOF")
print("  [OK] .env created")

# Verify
stdin, stdout, stderr = ssh.exec_command(f"cat {DEPLOY_DIR}/app/.env")
print(stdout.read().decode('utf-8'))

# Rebuild
print("\n[2/5] Rebuilding Docker image...")
start = time.time()
stdin, stdout, stderr = ssh.exec_command(
    f"cd {DEPLOY_DIR}/app && docker build -t expertos-web:latest . 2>&1",
    timeout=900
)
output = stdout.read().decode('utf-8', errors='replace')
elapsed = int(time.time() - start)

with open("env_fix_build.log", "w", encoding="utf-8") as f:
    f.write(output)

if "Successfully" in output:
    print(f"  [OK] Built in {elapsed}s!")
    
    # Start
    print("\n[3/5] Starting containers...")
    ssh.exec_command("docker stop expertos-web 2>/dev/null; docker rm expertos-web 2>/dev/null || true")
    time.sleep(3)
    stdin, stdout, stderr = ssh.exec_command(f"cd {DEPLOY_DIR} && docker-compose up -d 2>&1")
    print(stdout.read().decode('utf-8', errors='replace')[:400])
    print(stderr.read().decode('utf-8', errors='replace')[:400])
    
    # Verify
    print("\n[4/5] Verifying (25s wait)...")
    time.sleep(25)
    
    stdin, stdout, stderr = ssh.exec_command(f"cd {DEPLOY_DIR} && docker-compose ps")
    print(stdout.read().decode('utf-8'))
    
    stdin, stdout, stderr = ssh.exec_command("curl -s -m 10 -o /dev/null -w '%{http_code}' http://localhost:3001")
    code = stdout.read().decode('utf-8').strip()
    print(f"\nHTTP Status: {code}")
    
    if code in ["200", "302", "307"]:
        print("\n" + "="*60)
        print("  SUCCESS! ExpertOS is RUNNING!")
        print(f"  URL: http://{SERVER_IP}:3001")
        print("="*60)
    else:
        print("\n[5/5] Checking logs...")
        stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | tail -20")
        logs = stdout.read().decode('utf-8', errors='replace')
        for line in logs.split('\n'):
            print(''.join(c if ord(c) < 128 else '?' for c in line))
else:
    print(f"\n[FAIL] Build failed after {elapsed}s")
    for line in output.split('\n')[-40:]:
        print(''.join(c if ord(c) < 128 else '?' for c in line[:180]))

ssh.close()
