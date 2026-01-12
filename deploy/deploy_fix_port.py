#!/usr/bin/env python3
"""
ExpertOS Deployment - Fix Port and Start Web
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
    print(f"[*] {desc or cmd[:60]}...")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=600)
    out = stdout.read().decode('utf-8')
    err = stderr.read().decode('utf-8')
    if out:
        print(out[:2000])
    if err and "Warning" not in err:
        print(f"[stderr] {err[:500]}")
    return out

def main():
    print("=" * 50)
    print("  ExpertOS - Fix Port & Start Web")
    print("=" * 50)

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS, timeout=30)
    print("[+] Connected!")

    # Check what's using port 3000
    print("\n[1/6] Checking port 3000...")
    run_ssh(ssh, "ss -tlnp | grep 3000 || echo 'Port 3000 is free'", "Checking port 3000")
    
    # Stop old container
    print("\n[2/6] Stopping old web container...")
    run_ssh(ssh, "docker stop expertos-web 2>/dev/null; docker rm expertos-web 2>/dev/null || true", "Stop container")
    
    # Kill process on port 3000 if needed
    print("\n[3/6] Freeing port 3000...")
    run_ssh(ssh, "fuser -k 3000/tcp 2>/dev/null || true", "Killing process on 3000")
    
    # Update docker-compose to use port 3001 as fallback
    print("\n[4/6] Updating docker-compose.yml...")
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
    command: sh -c "npm install --legacy-peer-deps 2>&1 && npx prisma generate 2>&1 && npm run build 2>&1 && npm start"
    depends_on:
      db:
        condition: service_healthy

volumes:
  postgres_data:
  app_node_modules:
'''
    
    run_ssh(ssh, f"cat > {DEPLOY_DIR}/docker-compose.yml << 'EOFCOMPOSE'\n{compose}\nEOFCOMPOSE", "Write compose")

    # Start web container
    print("\n[5/6] Starting web container on port 3001...")
    run_ssh(ssh, f"cd {DEPLOY_DIR} && docker-compose up -d web", "Starting web")
    
    # Wait and check
    print("\n[6/6] Checking status...")
    run_ssh(ssh, "sleep 15", "Waiting...")
    run_ssh(ssh, f"cd {DEPLOY_DIR} && docker-compose ps", "Container status")
    run_ssh(ssh, f"cd {DEPLOY_DIR} && docker logs expertos-web 2>&1 | tail -30", "Web logs")

    print("\n" + "=" * 50)
    print("  DONE!")
    print("=" * 50)
    print(f"\nExpertOS URL: http://{SERVER_IP}:3001")
    print("(Build may take 2-5 minutes)")

    ssh.close()

if __name__ == "__main__":
    main()
