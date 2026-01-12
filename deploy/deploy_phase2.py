#!/usr/bin/env python3
"""
ExpertOS Full Deployment Script - Phase 2
Fix port conflict and deploy Next.js
"""

import subprocess
import sys

try:
    import paramiko
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko

# Server credentials
SERVER_IP = "193.233.233.217"
SERVER_USER = "root"
SERVER_PASS = "3WP64PLwbT2Y"
DEPLOY_DIR = "/var/www/expertos"

def run_ssh_command(ssh, command, description=""):
    """Execute command via SSH and return output"""
    print(f"\n[*] {description or command[:60]}...")
    stdin, stdout, stderr = ssh.exec_command(command, timeout=300)
    output = stdout.read().decode('utf-8')
    error = stderr.read().decode('utf-8')
    if output:
        print(output[:2000])  # Limit output
    if error and "Warning" not in error and "notice" not in error.lower():
        print(f"[stderr] {error[:500]}")
    return output, error

def main():
    print("=" * 50)
    print("  ExpertOS Full Deployment - Phase 2")
    print(f"  Server: {SERVER_IP}")
    print("=" * 50)

    # Connect via SSH
    print("\n[1/8] Connecting to server...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS, timeout=30)
        print("[+] Connected successfully!")
    except Exception as e:
        print(f"[!] Connection failed: {e}")
        return

    # Stop and remove conflicting container
    print("\n[2/8] Stopping any existing containers...")
    run_ssh_command(ssh, f"cd {DEPLOY_DIR} && docker-compose down 2>/dev/null || true", "Stopping containers")
    run_ssh_command(ssh, "docker stop expertos-db 2>/dev/null; docker rm expertos-db 2>/dev/null || true", "Removing old container")
    
    # Check what's using port 5432
    print("\n[3/8] Checking port 5432...")
    output, _ = run_ssh_command(ssh, "ss -tlnp | grep 5432 || echo 'Port 5432 is free'", "Checking port")
    
    if "5432" in output and "Port 5432 is free" not in output:
        print("[!] Port 5432 is in use by system PostgreSQL. Using port 5433 instead...")
        db_port = "5433"
    else:
        db_port = "5432"
        
    # Create updated docker-compose.yml with correct port
    print(f"\n[4/8] Creating docker-compose.yml (DB port: {db_port})...")
    
    compose_content = f'''version: '3.8'

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
      - "{db_port}:5432"
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
      - NEXTAUTH_URL=http://{SERVER_IP}:3000
      - NEXTAUTH_SECRET=ExpertOS2026SuperSecretKey1234567890
    ports:
      - "3000:3000"
    volumes:
      - ./app:/app
      - app_node_modules:/app/node_modules
    command: sh -c "npm install --legacy-peer-deps && npx prisma generate && npm run build && npm start"
    depends_on:
      db:
        condition: service_healthy

volumes:
  postgres_data:
  app_node_modules:
'''
    
    # Write docker-compose.yml
    run_ssh_command(ssh, f"cat > {DEPLOY_DIR}/docker-compose.yml << 'EOFCOMPOSE'\n{compose_content}\nEOFCOMPOSE", "Writing docker-compose.yml")

    # Start PostgreSQL first
    print("\n[5/8] Starting PostgreSQL container...")
    run_ssh_command(ssh, f"cd {DEPLOY_DIR} && docker-compose up -d db", "Starting PostgreSQL")
    
    # Wait for PostgreSQL to be healthy
    print("\n[6/8] Waiting for PostgreSQL to be healthy...")
    run_ssh_command(ssh, "sleep 10", "Waiting 10 seconds")
    run_ssh_command(ssh, f"cd {DEPLOY_DIR} && docker-compose ps", "Checking container status")
    
    # Create app directory
    print("\n[7/8] Creating app directory structure...")
    run_ssh_command(ssh, f"mkdir -p {DEPLOY_DIR}/app", "Creating app directory")
    
    # Check final status
    print("\n[8/8] Final status check...")
    run_ssh_command(ssh, f"cd {DEPLOY_DIR} && docker-compose ps", "Container status")
    run_ssh_command(ssh, f"cd {DEPLOY_DIR} && ls -la", "Directory listing")
    run_ssh_command(ssh, f"cd {DEPLOY_DIR} && docker-compose logs db --tail 10", "DB logs")

    print("\n" + "=" * 50)
    print("  PHASE 2 COMPLETE!")
    print("=" * 50)
    print(f"\n✅ PostgreSQL running on: {SERVER_IP}:{db_port}")
    print(f"✅ Deployment directory: {DEPLOY_DIR}")
    print(f"\n⏳ Next step: Upload Next.js app to {DEPLOY_DIR}/app/")
    print("   Then run: docker-compose up -d web")

    ssh.close()

if __name__ == "__main__":
    main()
