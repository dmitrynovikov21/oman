#!/usr/bin/env python3
"""
ExpertOS Server Deployment Script
Uses Paramiko for SSH connection with password authentication
"""

import subprocess
import sys

# Install paramiko if not present
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
    print(f"\n[*] {description or command}")
    stdin, stdout, stderr = ssh.exec_command(command)
    output = stdout.read().decode('utf-8')
    error = stderr.read().decode('utf-8')
    if output:
        print(output)
    if error and "Warning" not in error:
        print(f"[!] {error}")
    return output, error

def main():
    print("=" * 50)
    print("  ExpertOS Production Deployment")
    print(f"  Server: {SERVER_IP}")
    print("=" * 50)

    # Connect via SSH
    print("\n[1/6] Connecting to server...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS, timeout=30)
        print("[+] Connected successfully!")
    except Exception as e:
        print(f"[!] Connection failed: {e}")
        return

    # Check system info
    print("\n[2/6] Checking server info...")
    run_ssh_command(ssh, "hostname && uname -a", "Getting server info")

    # Check Docker
    print("\n[3/6] Checking Docker installation...")
    output, _ = run_ssh_command(ssh, "docker --version 2>/dev/null || echo 'DOCKER_NOT_INSTALLED'", "Checking Docker")
    
    if "DOCKER_NOT_INSTALLED" in output:
        print("[!] Docker not installed. Installing...")
        run_ssh_command(ssh, "curl -fsSL https://get.docker.com | sh", "Installing Docker")
        run_ssh_command(ssh, "systemctl start docker && systemctl enable docker", "Starting Docker")
    
    # Create deployment directory
    print("\n[4/6] Creating deployment directory...")
    run_ssh_command(ssh, f"mkdir -p {DEPLOY_DIR}", "Creating directory")
    run_ssh_command(ssh, f"ls -la {DEPLOY_DIR}", "Listing directory")

    # Create docker-compose.yml
    print("\n[5/6] Creating docker-compose.yml...")
    compose_content = '''version: '3.8'

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
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U expertos"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
'''
    
    run_ssh_command(ssh, f"cat > {DEPLOY_DIR}/docker-compose.yml << 'EOFCOMPOSE'\n{compose_content}\nEOFCOMPOSE", "Writing docker-compose.yml")

    # Start PostgreSQL
    print("\n[6/6] Starting PostgreSQL container...")
    run_ssh_command(ssh, f"cd {DEPLOY_DIR} && docker-compose up -d db", "Starting PostgreSQL")
    
    # Check status
    run_ssh_command(ssh, f"cd {DEPLOY_DIR} && docker-compose ps", "Checking container status")

    print("\n" + "=" * 50)
    print("  DEPLOYMENT COMPLETE!")
    print("=" * 50)
    print(f"\nPostgreSQL running on: {SERVER_IP}:5432")
    print(f"Deployment directory: {DEPLOY_DIR}")
    print("\nNext: Upload Next.js app and start web container")

    ssh.close()

if __name__ == "__main__":
    main()
