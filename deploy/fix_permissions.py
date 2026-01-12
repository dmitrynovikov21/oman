#!/usr/bin/env python3
"""Fix uploads folder permissions"""
import subprocess, sys, os, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
try:
    import paramiko
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("193.233.233.217", username="root", password="3WP64PLwbT2Y", timeout=30)
print("[+] Connected!")

# 1. Fix permissions on uploads folder in volume
print("\n[1] Fixing permissions on uploads volume...")
stdin, stdout, stderr = ssh.exec_command("docker exec -u root expertos-web chown -R nextjs:nodejs /app/public/uploads 2>&1")
result = stdout.read().decode('utf-8')
print(f"  Result: {result if result else 'OK'}")

stdin, stdout, stderr = ssh.exec_command("docker exec -u root expertos-web chmod -R 755 /app/public/uploads 2>&1")
result = stdout.read().decode('utf-8')
print(f"  chmod: {result if result else 'OK'}")

# 2. Verify permissions
print("\n[2] Verifying permissions:")
stdin, stdout, stderr = ssh.exec_command("docker exec expertos-web ls -la /app/public/uploads | head -5")
print(stdout.read().decode('utf-8'))

# 3. Test creating a new folder
print("[3] Testing folder creation:")
stdin, stdout, stderr = ssh.exec_command("docker exec expertos-web mkdir -p /app/public/uploads/test_folder 2>&1")
result = stdout.read().decode('utf-8')
if result:
    print(f"  Error: {result}")
else:
    print("  ✅ Folder creation works!")
    ssh.exec_command("docker exec expertos-web rm -rf /app/public/uploads/test_folder")

# 4. Restart container to apply
print("\n[4] Container status:")
stdin, stdout, stderr = ssh.exec_command("docker ps --format 'table {{.Names}}\\t{{.Status}}' | grep expertos")
print(stdout.read().decode('utf-8'))

print("\n  Permissions fixed! Try uploading again.")
print("  URL: http://193.233.233.217:3001")

ssh.close()
