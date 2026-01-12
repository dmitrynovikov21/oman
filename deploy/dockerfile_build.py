#!/usr/bin/env python3
"""
Deploy ExpertOS using Dockerfile approach instead of volume mounts
"""

import subprocess, sys, os, time
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

def run_ssh(ssh, cmd, desc="", timeout=600):
    print(f"[*] {desc}...")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out:
        print(out[:1500])
    if err and "Warning" not in err:
        print(f"[stderr] {err[:500]}")
    return out

def main():
    print("=" * 60)
    print("  ExpertOS - Dockerfile Build Approach")
    print("=" * 60)

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS, timeout=30)
    print("[+] Connected!")

    # Stop existing containers
    print("\n[1/6] Stopping existing web container...")
    run_ssh(ssh, "docker stop expertos-web 2>/dev/null; docker rm expertos-web 2>/dev/null || true", "Stopping container")

    # Create Dockerfile on server
    print("\n[2/6] Creating Dockerfile...")
    dockerfile = '''FROM node:20-slim

# Install dependencies
RUN apt-get update && apt-get install -y openssl ca-certificates curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps --ignore-scripts

# Copy all source files
COPY . .

# Generate Prisma client
RUN npx prisma@5.22.0 generate

# Build Next.js app
RUN npm run build

# Expose port
EXPOSE 3000

# Start
CMD ["npm", "start"]
'''
    
    run_ssh(ssh, f"cat > {DEPLOY_DIR}/app/Dockerfile << 'DOCKEREOF'\n{dockerfile}\nDOCKEREOF", "Writing Dockerfile")

    # Create .dockerignore
    dockerignore = '''node_modules
.next
.git
*.log
deploy
tests
audit_reports
'''
    run_ssh(ssh, f"cat > {DEPLOY_DIR}/app/.dockerignore << 'IGNOREEOF'\n{dockerignore}\nIGNOREEOF", "Writing .dockerignore")

    # Build image on server
    print("\n[3/6] Building Docker image (this will take 5-10 minutes)...")
    run_ssh(ssh, f"cd {DEPLOY_DIR}/app && docker build -t expertos-web:latest . 2>&1 | tail -30", "Building image", timeout=900)

    # Update docker-compose to use built image
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
    image: expertos-web:latest
    container_name: expertos-web
    restart: always
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://expertos:ExpertOS2026SecurePass@db:5432/expertos
      - NEXTAUTH_URL=http://{SERVER_IP}:3001
      - NEXTAUTH_SECRET=ExpertOS2026SuperSecretKey1234567890abcdefghij
    ports:
      - "3001:3000"
    depends_on:
      db:
        condition: service_healthy

volumes:
  postgres_data:
'''
    
    run_ssh(ssh, f"cat > {DEPLOY_DIR}/docker-compose.yml << 'COMPOSEEOF'\n{compose}\nCOMPOSEEOF", "Writing docker-compose.yml")

    # Start web container
    print("\n[5/6] Starting web container...")
    run_ssh(ssh, f"cd {DEPLOY_DIR} && docker-compose up -d web", "Starting container")

    # Wait and verify
    print("\n[6/6] Waiting and verifying...")
    time.sleep(15)
    run_ssh(ssh, f"cd {DEPLOY_DIR} && docker-compose ps", "Container status")
    
    # Test HTTP
    stdin, stdout, stderr = ssh.exec_command("curl -s -m 10 -o /dev/null -w '%{http_code}' http://localhost:3001")
    code = stdout.read().decode('utf-8').strip()
    print(f"\nHTTP Status: {code}")

    if code in ["200", "302", "307"]:
        print("\n" + "=" * 60)
        print("  SUCCESS! ExpertOS is running!")
        print(f"  URL: http://{SERVER_IP}:3001")
        print("=" * 60)
    else:
        print("\n[!] App not responding yet. Checking logs...")
        run_ssh(ssh, "docker logs expertos-web 2>&1 | tail -20", "Container logs")

    ssh.close()

if __name__ == "__main__":
    main()
