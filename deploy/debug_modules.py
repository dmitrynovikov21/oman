#!/usr/bin/env python3
"""Debug module resolution"""
import subprocess, sys, os
os.environ["PYTHONIOENCODING"] = "utf-8"
try:
    import paramiko
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("193.233.233.217", username="root", password="3WP64PLwbT2Y", timeout=30)

print("[1] Files in components/ui:")
stdin, stdout, stderr = ssh.exec_command("ls -la /var/www/expertos/app/components/ui/ | head -20")
print(stdout.read().decode('utf-8'))

print("\n[2] Check button.tsx exists:")
stdin, stdout, stderr = ssh.exec_command("ls -la /var/www/expertos/app/components/ui/button.tsx 2>&1")
print(stdout.read().decode('utf-8'))

print("\n[3] Content of button.tsx (first 10 lines):")
stdin, stdout, stderr = ssh.exec_command("head -10 /var/www/expertos/app/components/ui/button.tsx 2>&1")
print(stdout.read().decode('utf-8'))

print("\n[4] Check if shared/icons.tsx exists:")
stdin, stdout, stderr = ssh.exec_command("ls -la /var/www/expertos/app/components/shared/icons.tsx 2>&1")
print(stdout.read().decode('utf-8'))

print("\n[5] Check node_modules volume permissions:")
stdin, stdout, stderr = ssh.exec_command("docker exec expertos-web ls -la /app/components/ui/ 2>&1 | head -15")
print(stdout.read().decode('utf-8'))

ssh.close()
