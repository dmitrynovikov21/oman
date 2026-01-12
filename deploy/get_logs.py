#!/usr/bin/env python3
"""Get server logs"""
import subprocess, sys, os
os.environ["PYTHONIOENCODING"] = "utf-8"
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
try:
    import paramiko
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("193.233.233.217", username="root", password="3WP64PLwbT2Y", timeout=30)
print("[+] Connected!\n")

print("="*70)
print("  EXPERTOS-WEB LOGS (last 100 lines)")
print("="*70)
stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | tail -100")
print(stdout.read().decode('utf-8', errors='replace'))

print("\n" + "="*70)
print("  ERROR LOGS")
print("="*70)
stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | grep -iE '(error|fail|exception|warn)' | tail -30")
print(stdout.read().decode('utf-8', errors='replace'))

print("\n" + "="*70)
print("  OCR RELATED LOGS")
print("="*70)
stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | grep -iE '(ocr|pdf|document|extract|parse)' | tail -20")
print(stdout.read().decode('utf-8', errors='replace'))

print("\n" + "="*70)
print("  DATABASE TABLE CHECK")
print("="*70)
stdin, stdout, stderr = ssh.exec_command('docker exec expertos-db psql -U expertos -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'documents\' LIMIT 15;"')
print(stdout.read().decode('utf-8'))

stdin, stdout, stderr = ssh.exec_command('docker exec expertos-db psql -U expertos -c "SELECT id, name, file_path, ocr_status FROM documents ORDER BY created_at DESC LIMIT 5;"')
print(stdout.read().decode('utf-8'))

ssh.close()
