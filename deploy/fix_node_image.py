#!/usr/bin/env python3
"""
Fix: Switch to node:20-slim (Debian-based) for Prisma compatibility
"""

import subprocess
import sys
import os

os.environ["PYTHONIOENCODING"] = "utf-8"

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
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=600)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    for char in ['\u2714', '\u2705', '\u25cf', '\u2588', '\u2593']:
        out = out.replace(char, '[X]')
        err = err.replace(char, '[X]')
    if out:
        print(out[:2000])
    if err and "Warning" not in err:
        print(f"[stderr] {err[:500]}")
    return out

def main():
    print("=" * 60)
    print("  Fix: Switch to node:20-slim for Prisma")
    print("=" * 60)

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS, timeout=30)
    print("[+] Connected!")

    # Stop container
    print("\n[1/4] Stopping web container...")
    run_ssh(ssh, "docker stop expertos-web; docker rm expertos-web 2>/dev/null || true", "Stopping")
    
    # Update docker-compose to use node:20-slim instead of alpine
    print("\n[2/4] Updating docker-compose with node:20-slim...")
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
    image: node:20-slim
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
    command: >
      bash -c "
        apt-get update && apt-get install -y openssl ca-certificates &&
        npm install --legacy-peer-deps --ignore-scripts &&
        npx prisma@5.22.0 generate &&
        npx prisma@5.22.0 db push --accept-data-loss &&
        npm run build &&
        npm start
      "
    depends_on:
      db:
        condition: service_healthy

volumes:
  postgres_data:
  app_node_modules:
'''
    
    run_ssh(ssh, f"cat > {DEPLOY_DIR}/docker-compose.yml << 'EOF'\n{compose}\nEOF", "Writing compose")

    # Start web container
    print("\n[3/4] Starting web container with node:20-slim...")
    run_ssh(ssh, f"cd {DEPLOY_DIR} && docker-compose up -d web", "Starting web")
    
    # Wait and check
    print("\n[4/4] Checking status (build will take 5-10 minutes)...")
    run_ssh(ssh, "sleep 30", "Waiting 30s")
    run_ssh(ssh, f"cd {DEPLOY_DIR} && docker-compose ps", "Status")
    run_ssh(ssh, "docker logs expertos-web 2>&1 | tail -30 | tr -d '\\x00-\\x1F\\x7F\\x80-\\xFF' | head -25", "Logs preview")

    print("\n" + "=" * 60)
    print("  Container started with node:20-slim")
    print("  Build will take 5-10 minutes.")
    print(f"  URL: http://{SERVER_IP}:3001")
    print("=" * 60)

    ssh.close()

if __name__ == "__main__":
    main()
