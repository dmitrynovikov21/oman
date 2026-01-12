#!/usr/bin/env python3
"""Debug Enhanced OCR container"""
import sys, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
try:
    import paramiko
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("193.233.233.217", username="root", password="3WP64PLwbT2Y", timeout=60, banner_timeout=60)
print("[OK] Connected!\n")

# 1. Check container status
print("[1] Container status:")
stdin, stdout, stderr = ssh.exec_command("docker ps -a -f name=enhanced-ocr", timeout=30)
print(stdout.read().decode())

# 2. Check logs
print("\n[2] Container logs (last 50 lines):")
stdin, stdout, stderr = ssh.exec_command("docker logs enhanced-ocr --tail 50 2>&1", timeout=30)
print(stdout.read().decode())

# 3. Check if port is listening
print("\n[3] Port 5001 status:")
stdin, stdout, stderr = ssh.exec_command("netstat -tlnp | grep 5001 || ss -tlnp | grep 5001", timeout=30)
print(stdout.read().decode())

# 4. Check if we can connect locally
print("\n[4] Test local connection:")
stdin, stdout, stderr = ssh.exec_command("python3 -c \"import socket; s=socket.socket(); s.settimeout(5); r=s.connect_ex(('127.0.0.1', 5001)); print('Port open' if r==0 else 'Port closed'); s.close()\"", timeout=30)
print(stdout.read().decode())

# 5. If container not running, try restarting
print("\n[5] Restarting container if needed...")
stdin, stdout, stderr = ssh.exec_command("docker ps -f name=enhanced-ocr --format '{{.Status}}'", timeout=30)
status = stdout.read().decode().strip()

if not status:
    print("  Container not running, starting...")
    run_cmd = '''docker run -d --name enhanced-ocr --restart always \
        --network expertos_default \
        -p 5001:5001 \
        -v /var/www/expertos/app/public/uploads:/uploads:ro \
        enhanced-ocr:latest'''
    ssh.exec_command(run_cmd, timeout=30)
    time.sleep(10)
    
    stdin, stdout, stderr = ssh.exec_command("docker logs enhanced-ocr --tail 10 2>&1", timeout=30)
    print(stdout.read().decode())
else:
    print(f"  Container status: {status}")

ssh.close()
