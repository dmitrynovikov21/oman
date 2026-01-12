#!/usr/bin/env python3
"""Debug 1list.pdf OCR issue"""
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

# 1. Find 1list.pdf document
print("\n[1] Finding 1list.pdf in database:")
stdin, stdout, stderr = ssh.exec_command('docker exec expertos-db psql -U expertos -c "SELECT id, name, file_path, \\\"ocrStatus\\\" FROM documents WHERE name LIKE \'%1list%\' ORDER BY created_at DESC LIMIT 3;"')
print(stdout.read().decode('utf-8'))

# Get document ID
stdin, stdout, stderr = ssh.exec_command('docker exec expertos-db psql -U expertos -t -c "SELECT id, file_path FROM documents WHERE name LIKE \'%1list%\' ORDER BY created_at DESC LIMIT 1;"')
result = stdout.read().decode('utf-8').strip()
if result:
    parts = result.split('|')
    doc_id = parts[0].strip()
    file_path = parts[1].strip() if len(parts) > 1 else ""
    
    print(f"\n[2] Document ID: {doc_id}")
    print(f"    File path: {file_path}")
    
    # Check if file exists
    print("\n[3] Checking if file exists:")
    stdin, stdout, stderr = ssh.exec_command(f"docker exec expertos-web ls -la /app/public{file_path} 2>&1")
    print(f"    {stdout.read().decode('utf-8', errors='replace')}")
    
    # Try OCR API
    print("\n[4] Calling OCR API...")
    cmd = f'''curl -s -X POST http://localhost:3001/api/ocr -H "Content-Type: application/json" -d '{{"documentId":"{doc_id}"}}' 2>&1'''
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=60)
    response = stdout.read().decode('utf-8', errors='replace')
    print(f"    Response: {response[:600]}")
    
    # Check logs
    time.sleep(2)
    print("\n[5] Recent OCR logs:")
    stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | grep -i 'OCR' | tail -10")
    print(stdout.read().decode('utf-8', errors='replace'))
    
    # Check document status after OCR
    print("\n[6] Document status after OCR:")
    stdin, stdout, stderr = ssh.exec_command(f'''docker exec expertos-db psql -U expertos -c "SELECT \\\"ocrStatus\\\", LENGTH(extracted_text) as len FROM documents WHERE id = '{doc_id}';"''')
    print(stdout.read().decode('utf-8'))
else:
    print("  No 1list.pdf found in database")
    
    # Check all recent documents
    print("\n  Recent documents:")
    stdin, stdout, stderr = ssh.exec_command('docker exec expertos-db psql -U expertos -c "SELECT id, name, \\\"ocrStatus\\\" FROM documents ORDER BY created_at DESC LIMIT 5;"')
    print(stdout.read().decode('utf-8'))

ssh.close()
