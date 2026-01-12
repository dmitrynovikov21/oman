#!/usr/bin/env python3
"""
ExpertOS Full Deployment - Phase 3
Upload Next.js app to server
"""

import subprocess
import sys
import os
import io

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
LOCAL_APP_DIR = r"c:\gravity\gravity\expertos"

# Files to upload (essential for deployment)
ESSENTIAL_FILES = [
    "package.json",
    "package-lock.json",
    "next.config.mjs",
    "tsconfig.json",
    "tailwind.config.ts",
    "postcss.config.js",
    "middleware.ts",
    "env.mjs",
]

ESSENTIAL_DIRS = [
    "app",
    "components",
    "lib",
    "prisma",
    "public",
    "config",
    "styles",
]

def run_ssh_command(ssh, command, description=""):
    """Execute command via SSH and return output"""
    print(f"[*] {description or command[:80]}...")
    stdin, stdout, stderr = ssh.exec_command(command, timeout=600)
    output = stdout.read().decode('utf-8')
    error = stderr.read().decode('utf-8')
    if output:
        print(output[:1500])
    if error and "Warning" not in error:
        print(f"[!] {error[:500]}")
    return output, error

def upload_file(sftp, local_path, remote_path):
    """Upload a single file"""
    try:
        sftp.put(local_path, remote_path)
        return True
    except Exception as e:
        print(f"[!] Error uploading {local_path}: {e}")
        return False

def upload_directory(sftp, local_dir, remote_dir):
    """Recursively upload a directory"""
    try:
        sftp.mkdir(remote_dir)
    except:
        pass  # Directory might exist
    
    count = 0
    for item in os.listdir(local_dir):
        local_path = os.path.join(local_dir, item)
        remote_path = f"{remote_dir}/{item}"
        
        # Skip unnecessary directories
        if item in ['node_modules', '.next', '.git', '__pycache__', 'audit_reports', 'test-ocr-8-1', 'tests', '.env', 'deploy']:
            continue
            
        if os.path.isfile(local_path):
            if upload_file(sftp, local_path, remote_path):
                count += 1
        elif os.path.isdir(local_path):
            count += upload_directory(sftp, local_path, remote_path)
    
    return count

def main():
    print("=" * 50)
    print("  ExpertOS Deployment - Phase 3: Upload Code")
    print(f"  Server: {SERVER_IP}")
    print("=" * 50)

    # Connect
    print("\n[1/5] Connecting to server...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS, timeout=30)
    sftp = ssh.open_sftp()
    print("[+] Connected!")

    # Create .env file on server
    print("\n[2/5] Creating .env file on server...")
    env_content = f'''DATABASE_URL="postgresql://expertos:ExpertOS2026SecurePass@db:5432/expertos"
NEXTAUTH_URL="http://{SERVER_IP}:3000"
NEXTAUTH_SECRET="ExpertOS2026SuperSecretKey1234567890abcdefghij"
NODE_ENV="production"
'''
    
    run_ssh_command(ssh, f"cat > {DEPLOY_DIR}/app/.env << 'ENVEOF'\n{env_content}\nENVEOF", "Creating .env")

    # Upload essential files first
    print("\n[3/5] Uploading essential files...")
    app_remote = f"{DEPLOY_DIR}/app"
    
    for filename in ESSENTIAL_FILES:
        local_path = os.path.join(LOCAL_APP_DIR, filename)
        if os.path.exists(local_path):
            remote_path = f"{app_remote}/{filename}"
            print(f"  Uploading {filename}...")
            upload_file(sftp, local_path, remote_path)

    # Upload essential directories
    print("\n[4/5] Uploading directories (this may take a while)...")
    total_files = 0
    
    for dirname in ESSENTIAL_DIRS:
        local_dir = os.path.join(LOCAL_APP_DIR, dirname)
        if os.path.exists(local_dir):
            print(f"  Uploading {dirname}/...")
            remote_dir = f"{app_remote}/{dirname}"
            count = upload_directory(sftp, local_dir, remote_dir)
            total_files += count
            print(f"    -> {count} files")

    print(f"\n  Total files uploaded: {total_files}")

    # Start the web container
    print("\n[5/5] Starting Next.js container...")
    run_ssh_command(ssh, f"cd {DEPLOY_DIR} && docker-compose up -d web", "Starting web container")
    
    # Wait and check
    run_ssh_command(ssh, "sleep 30", "Waiting for npm install...")
    run_ssh_command(ssh, f"cd {DEPLOY_DIR} && docker-compose ps", "Container status")
    run_ssh_command(ssh, f"cd {DEPLOY_DIR} && docker-compose logs web --tail 30 2>&1 | head -50", "Web logs")

    print("\n" + "=" * 50)
    print("  PHASE 3 COMPLETE!")
    print("=" * 50)
    print(f"\nAccess ExpertOS at: http://{SERVER_IP}:3000")
    print("(Note: First launch may take 2-5 minutes for npm install + build)")

    sftp.close()
    ssh.close()

if __name__ == "__main__":
    main()
