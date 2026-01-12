#!/usr/bin/env python3
"""Check and upload missing dashboard pages"""

import subprocess, sys, os
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
            try:
                sftp.put(local_path, remote_path)
                count += 1
            except Exception as e:
                print(f"    [!] {item}: {e}")
        elif os.path.isdir(local_path):
            count += upload_directory(sftp, local_path, remote_path)
    
    return count

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS, timeout=30)
sftp = ssh.open_sftp()
print("[+] Connected!")

# Check what's in dashboard on server
print("\n[1] Checking dashboard folder on server...")
stdin, stdout, stderr = ssh.exec_command(f"ls -la {DEPLOY_DIR}/app/app/\\(protected\\)/dashboard/")
print(stdout.read().decode('utf-8'))

# Upload dashboard/billing if missing
print("\n[2] Uploading dashboard/billing...")
local_billing = os.path.join(LOCAL_DIR, "app", "(protected)", "dashboard", "billing")
remote_billing = f"{DEPLOY_DIR}/app/app/(protected)/dashboard/billing"
if os.path.exists(local_billing):
    count = upload_directory(sftp, local_billing, remote_billing)
    print(f"  Uploaded {count} files")

# Upload dashboard/settings if missing
print("\n[3] Uploading dashboard/settings...")
local_settings = os.path.join(LOCAL_DIR, "app", "(protected)", "dashboard", "settings")
remote_settings = f"{DEPLOY_DIR}/app/app/(protected)/dashboard/settings"
if os.path.exists(local_settings):
    count = upload_directory(sftp, local_settings, remote_settings)
    print(f"  Uploaded {count} files")

# Upload dashboard/charts
print("\n[4] Uploading dashboard/charts...")
local_charts = os.path.join(LOCAL_DIR, "app", "(protected)", "dashboard", "charts")
remote_charts = f"{DEPLOY_DIR}/app/app/(protected)/dashboard/charts"
if os.path.exists(local_charts):
    count = upload_directory(sftp, local_charts, remote_charts)
    print(f"  Uploaded {count} files")

# Upload help page
print("\n[5] Uploading help page...")
local_help = os.path.join(LOCAL_DIR, "app", "(protected)", "help")
remote_help = f"{DEPLOY_DIR}/app/app/(protected)/help"
if os.path.exists(local_help):
    count = upload_directory(sftp, local_help, remote_help)
    print(f"  Uploaded {count} files")

# Verify
print("\n[6] Verifying dashboard structure on server...")
stdin, stdout, stderr = ssh.exec_command(f"ls -la {DEPLOY_DIR}/app/app/\\(protected\\)/dashboard/")
print(stdout.read().decode('utf-8'))

sftp.close()
ssh.close()
print("\n[OK] Dashboard pages uploaded. Need to rebuild Docker to apply changes.")
