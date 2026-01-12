#!/usr/bin/env python3
"""Test OCR with valid document"""
import subprocess, sys, os
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

# Test with document that has valid file
doc_id = "cmk7xwmx100024nfvjqkg6cay"
print(f"\nTesting OCR with document: {doc_id}")

# First verify file exists
stdin, stdout, stderr = ssh.exec_command(f'docker exec expertos-db psql -U expertos -t -c "SELECT file_path FROM documents WHERE id = \'{doc_id}\';"')
path = stdout.read().decode('utf-8').strip()
print(f"DB file_path: {path}")

stdin, stdout, stderr = ssh.exec_command(f"docker exec expertos-web ls -la /app/public{path} 2>&1")
print(f"File exists: {stdout.read().decode('utf-8', errors='replace')}")

# Call OCR API
print("\nCalling OCR API...")
cmd = f'''curl -s -X POST http://localhost:3001/api/ocr -H "Content-Type: application/json" -d '{{"documentId":"{doc_id}"}}' 2>&1'''
stdin, stdout, stderr = ssh.exec_command(cmd, timeout=60)
result = stdout.read().decode('utf-8', errors='replace')
print(f"API Response:\n{result}")

# Check result in DB
import time
time.sleep(2)
stdin, stdout, stderr = ssh.exec_command(f'''docker exec expertos-db psql -U expertos -c "SELECT \\\"ocrStatus\\\", LENGTH(extracted_text) as len FROM documents WHERE id = '{doc_id}';"''')
print(f"\nDocument status after OCR:\n{stdout.read().decode('utf-8')}")

# Check logs
stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | grep -i 'OCR' | tail -5")
print(f"OCR Logs:\n{stdout.read().decode('utf-8', errors='replace')}")

ssh.close()
