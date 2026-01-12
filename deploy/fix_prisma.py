#!/usr/bin/env python3
"""
Fix Prisma issue - update command to use npx
"""

import subprocess
import sys

try:
    import paramiko
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko

SERVER_IP = "193.233.233.217"
SERVER_USER = "root"
SERVER_PASS = "3WP64PLwbT2Y"
DEPLOY_DIR = "/var/www/expertos"

def run_ssh(ssh, cmd, desc=""):
    print(f"[*] {desc}...")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=300)
    out = stdout.read().decode('utf-8')
    err = stderr.read().decode('utf-8')
    if out:
        print(out[:2000])
    if err and "Warning" not in err:
        print(f"[stderr] {err[:500]}")
    return out

def main():
    print("=" * 50)
    print("  Fix Prisma Issue")
    print("=" * 50)

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS, timeout=30)
    except Exception as e:
        print(f"[!] Connection failed: {e}")
        return
        
    print("[+] Connected!")

    # Stop container
    print("\n[1/4] Stopping web container...")
    run_ssh(ssh, "docker stop expertos-web; docker rm expertos-web 2>/dev/null || true", "Stopping")
    
    # Update package.json to remove problematic postinstall
    print("\n[2/4] Fixing package.json postinstall script...")
    run_ssh(ssh, f'''cd {DEPLOY_DIR}/app && sed -i 's/"postinstall": "prisma generate"/"postinstall": "echo prisma will be run manually"/g' package.json''', "Fixing package.json")
    
    # Create new docker-compose with fixed command
    print("\n[3/4] Updating docker-compose with fixed command...")
    compose = f'''version: '3.8'

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
      interval: 10s
      timeout: 5s
      retries: 5

  web:
    image: node:20-alpine
    container_name: expertos-web
    restart: always
    working_dir: /app
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://expertos:ExpertOS2026SecurePass@db:5432/expertos
      - NEXTAUTH_URL=http://{SERVER_IP}:3001
      - NEXTAUTH_SECRET=ExpertOS2026SuperSecretKey1234567890abcdefghij
    ports:
      - "3001:3000"
    volumes:
      - ./app:/app
      - app_node_modules:/app/node_modules
    command: sh -c "npm install --legacy-peer-deps --ignore-scripts && npx prisma generate && npm run build && npm start"
    depends_on:
      db:
        condition: service_healthy

volumes:
  postgres_data:
  app_node_modules:
'''
    
    run_ssh(ssh, f"cat > {DEPLOY_DIR}/docker-compose.yml << 'EOF'\n{compose}\nEOF", "Writing docker-compose")

    # Start web container
    print("\n[4/4] Starting web container...")
    run_ssh(ssh, f"cd {DEPLOY_DIR} && docker-compose up -d web", "Starting web")
    
    # Check status
    run_ssh(ssh, "sleep 10", "Waiting")
    run_ssh(ssh, f"cd {DEPLOY_DIR} && docker-compose ps", "Status")
    run_ssh(ssh, f"docker logs expertos-web 2>&1 | tail -30", "Logs")

    print("\n" + "=" * 50)
    print("  DONE! Waiting for build...")
    print("=" * 50)
    print(f"\nURL: http://{SERVER_IP}:3001")
    print("npm install + build may take 3-5 minutes")

    ssh.close()

if __name__ == "__main__":
    main()
