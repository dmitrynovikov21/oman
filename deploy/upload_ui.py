#!/usr/bin/env python3
"""Check and upload missing components/ui"""
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

def upload_directory(sftp, local_dir, remote_dir):
    """Recursively upload a directory"""
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
                print(f"  [!] Failed: {item}: {e}")
        elif os.path.isdir(local_path):
            count += upload_directory(sftp, local_path, remote_path)
    
    return count

def main():
    print("=" * 60)
    print("  Upload Missing components/ui")
    print("=" * 60)

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS, timeout=30)
    sftp = ssh.open_sftp()
    print("[+] Connected!")

    # Check what exists on server
    print("\n[1/3] Checking server components directory...")
    stdin, stdout, stderr = ssh.exec_command(f"ls -la {DEPLOY_DIR}/app/components/ 2>/dev/null | head -20")
    print(stdout.read().decode('utf-8'))

    # Check if components/ui exists
    stdin, stdout, stderr = ssh.exec_command(f"ls {DEPLOY_DIR}/app/components/ui/ 2>/dev/null | wc -l")
    ui_count = stdout.read().decode('utf-8').strip()
    print(f"Files in components/ui on server: {ui_count}")

    if int(ui_count) < 40:
        print("\n[2/3] Uploading components/ui...")
        local_ui = os.path.join(LOCAL_DIR, "components", "ui")
        remote_ui = f"{DEPLOY_DIR}/app/components/ui"
        count = upload_directory(sftp, local_ui, remote_ui)
        print(f"  Uploaded {count} files to components/ui")
    else:
        print("\n[2/3] components/ui seems complete, skipping...")

    # Also check/upload types directory if needed
    stdin, stdout, stderr = ssh.exec_command(f"ls {DEPLOY_DIR}/app/types/ 2>/dev/null | wc -l")
    types_count = stdout.read().decode('utf-8').strip()
    print(f"\nFiles in types/ on server: {types_count}")
    
    if int(types_count) == 0:
        print("Uploading types/...")
        local_types = os.path.join(LOCAL_DIR, "types")
        if os.path.exists(local_types):
            remote_types = f"{DEPLOY_DIR}/app/types"
            count = upload_directory(sftp, local_types, remote_types)
            print(f"  Uploaded {count} files to types/")

    # Restart web container
    print("\n[3/3] Restarting web container...")
    ssh.exec_command("docker restart expertos-web")
    print("Container restarted. Build will take 3-5 minutes.")

    print("\n" + "=" * 60)
    print(f"  URL: http://{SERVER_IP}:3001")
    print("=" * 60)

    sftp.close()
    ssh.close()

if __name__ == "__main__":
    main()
