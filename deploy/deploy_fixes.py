#!/usr/bin/env python3
"""Deploy fixes: auth trustHost, URL fix, persistent uploads"""

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
LOCAL_DIR = r"c:\gravity\gravity\expertos"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS, timeout=30)
sftp = ssh.open_sftp()
print("[+] Connected!")

# 1. Upload fixed auth.ts
print("\n[1/5] Uploading fixed auth.ts...")
sftp.put(os.path.join(LOCAL_DIR, "auth.ts"), f"{DEPLOY_DIR}/app/auth.ts")
print("  [OK]")

# 2. Upload fixed lib/utils.ts
print("\n[2/5] Uploading fixed lib/utils.ts...")
sftp.put(os.path.join(LOCAL_DIR, "lib", "utils.ts"), f"{DEPLOY_DIR}/app/lib/utils.ts")
print("  [OK]")

# 3. Fix docker-compose to add uploads volume
print("\n[3/5] Updating docker-compose.yml for persistent uploads...")
compose_content = '''version: "3.8"

services:
  db:
    image: postgres:16-alpine
    container_name: expertos-db
    restart: always
    environment:
      POSTGRES_USER: expertos
      POSTGRES_PASSWORD: ExpertOS2026SecurePass
      POSTGRES_DB: expertos
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5433:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U expertos"]
      interval: 5s
      timeout: 5s
      retries: 5

  web:
    image: expertos-web:latest
    container_name: expertos-web
    restart: always
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "3001:3000"
    environment:
      - DATABASE_URL=postgresql://expertos:ExpertOS2026SecurePass@db:5432/expertos
      - NEXTAUTH_URL=http://193.233.233.217:3001
      - NEXTAUTH_SECRET=ExpertOS2026SuperSecretKey1234567890abcdefghij
      - AUTH_SECRET=ExpertOS2026SuperSecretKey1234567890abcdefghij
      - AUTH_TRUST_HOST=true
      - NEXT_PUBLIC_APP_URL=http://193.233.233.217:3001
      - NODE_ENV=production
    volumes:
      - uploads_data:/app/public/uploads

volumes:
  postgres_data:
  uploads_data:
'''
with sftp.open(f"{DEPLOY_DIR}/docker-compose.yml", 'w') as f:
    f.write(compose_content)
print("  [OK] docker-compose.yml updated with uploads volume")

# 4. Rebuild image
print("\n[4/5] Rebuilding Docker image...")
start = time.time()
stdin, stdout, stderr = ssh.exec_command(
    f"cd {DEPLOY_DIR}/app && docker build -t expertos-web:latest . 2>&1 | tail -10",
    timeout=600
)
output = stdout.read().decode('utf-8', errors='replace')
elapsed = int(time.time() - start)
print(f"  Build completed in {elapsed}s")

if "Successfully" in output:
    print("  [OK] Image built!")
    
    # 5. Restart with new compose
    print("\n[5/5] Restarting containers...")
    ssh.exec_command("docker-compose -f /var/www/expertos/docker-compose.yml down 2>/dev/null")
    time.sleep(5)
    stdin, stdout, stderr = ssh.exec_command(f"cd {DEPLOY_DIR} && docker-compose up -d 2>&1")
    print(stdout.read().decode('utf-8', errors='replace')[:400])
    
    # Wait
    print("\n  Waiting 30s...")
    time.sleep(30)
    
    # Verify
    stdin, stdout, stderr = ssh.exec_command("curl -s -m 5 -o /dev/null -w '%{http_code}' http://localhost:3001/dashboard")
    code = stdout.read().decode('utf-8').strip()
    print(f"  Dashboard: {code}")
    
    # Check auth logs
    stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | grep -i 'untrusted\\|error' | tail -5")
    errors = stdout.read().decode('utf-8', errors='replace')
    if "UntrustedHost" in errors:
        print(f"  [!] Auth errors still present")
    else:
        print("  [OK] No UntrustedHost errors")
    
    # Check uploads volume
    print("\n  Checking uploads volume...")
    stdin, stdout, stderr = ssh.exec_command("docker exec expertos-web ls -la /app/public/uploads 2>&1 | head -5")
    print(stdout.read().decode('utf-8'))
    
    print(f"\n  URL: http://{SERVER_IP}:3001")
else:
    print("  [FAIL] Build failed")
    print(output[-500:])

sftp.close()
ssh.close()
