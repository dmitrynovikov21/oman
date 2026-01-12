#!/usr/bin/env python3
"""Upload missing directories to server"""

import subprocess, sys, os
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
LOCAL_DIR = r"c:\gravity\gravity\expertos"

def upload_file(sftp, local_path, remote_path):
    try:
        sftp.put(local_path, remote_path)
        return True
    except Exception as e:
        print(f"  [!] Error: {e}")
        return False

def upload_directory(sftp, local_dir, remote_dir):
    try:
        sftp.mkdir(remote_dir)
    except:
        pass
    
    count = 0
    for item in os.listdir(local_dir):
        local_path = os.path.join(local_dir, item)
        remote_path = f"{remote_dir}/{item}"
        
        if item in ['node_modules', '.next', '.git', '__pycache__']:
            continue
            
        if os.path.isfile(local_path):
            if upload_file(sftp, local_path, remote_path):
                count += 1
        elif os.path.isdir(local_path):
            count += upload_directory(sftp, local_path, remote_path)
    
    return count

def main():
    print("=" * 60)
    print("  Upload Missing Files")
    print("=" * 60)

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS, timeout=30)
    sftp = ssh.open_sftp()
    print("[+] Connected!")

    # Upload actions directory
    print("\n[1/5] Uploading actions/...")
    local_actions = os.path.join(LOCAL_DIR, "actions")
    remote_actions = f"{DEPLOY_DIR}/app/actions"
    count = upload_directory(sftp, local_actions, remote_actions)
    print(f"  -> {count} files")

    # Upload hooks directory  
    print("\n[2/5] Uploading hooks/...")
    local_hooks = os.path.join(LOCAL_DIR, "hooks")
    remote_hooks = f"{DEPLOY_DIR}/app/hooks"
    count = upload_directory(sftp, local_hooks, remote_hooks)
    print(f"  -> {count} files")

    # Upload auth.ts
    print("\n[3/5] Uploading auth.ts...")
    upload_file(sftp, os.path.join(LOCAL_DIR, "auth.ts"), f"{DEPLOY_DIR}/app/auth.ts")
    
    # Upload auth.config.ts
    print("\n[4/5] Uploading auth.config.ts...")
    upload_file(sftp, os.path.join(LOCAL_DIR, "auth.config.ts"), f"{DEPLOY_DIR}/app/auth.config.ts")

    # Upload emails directory if exists
    emails_dir = os.path.join(LOCAL_DIR, "emails")
    if os.path.exists(emails_dir):
        print("\n[5/5] Uploading emails/...")
        count = upload_directory(sftp, emails_dir, f"{DEPLOY_DIR}/app/emails")
        print(f"  -> {count} files")

    # List what we uploaded
    print("\n=== Verification ===")
    stdin, stdout, stderr = ssh.exec_command(f"ls -la {DEPLOY_DIR}/app/actions/ 2>&1")
    print(f"actions/: {stdout.read().decode('utf-8')}")
    
    stdin, stdout, stderr = ssh.exec_command(f"ls -la {DEPLOY_DIR}/app/hooks/ 2>&1")
    print(f"hooks/: {stdout.read().decode('utf-8')}")
    
    stdin, stdout, stderr = ssh.exec_command(f"ls -la {DEPLOY_DIR}/app/auth.ts 2>&1")
    print(f"auth.ts: {stdout.read().decode('utf-8')}")

    print("\n" + "=" * 60)
    print("  Files uploaded! Now rebuild Docker image...")
    print("=" * 60)

    sftp.close()
    ssh.close()

if __name__ == "__main__":
    main()
