#!/usr/bin/env python3
"""Test OCR with real document"""
import subprocess, sys, os, time
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
print("[+] Connected!")

# Get documents from DB
print("\n[1] Documents in database:")
stdin, stdout, stderr = ssh.exec_command('docker exec expertos-db psql -U expertos -c "SELECT id, name, file_path, \\\"ocrStatus\\\" FROM documents ORDER BY created_at DESC LIMIT 5;"')
print(stdout.read().decode('utf-8'))

# Get first document ID
stdin, stdout, stderr = ssh.exec_command('docker exec expertos-db psql -U expertos -t -c "SELECT id, name FROM documents WHERE file_path LIKE \'%.pdf\' ORDER BY created_at DESC LIMIT 1;"')
doc_info = stdout.read().decode('utf-8').strip()

if doc_info:
    parts = doc_info.split('|')
    doc_id = parts[0].strip()
    doc_name = parts[1].strip() if len(parts) > 1 else "unknown"
    
    print(f"\n[2] Testing OCR on: {doc_name}")
    print(f"    Document ID: {doc_id}")
    
    # Call OCR API
    cmd = f'''curl -s -X POST http://localhost:3001/api/ocr -H "Content-Type: application/json" -d '{{"documentId":"{doc_id}"}}' 2>&1'''
    print(f"\n    Calling OCR API...")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=60)
    result = stdout.read().decode('utf-8', errors='replace')
    
    print(f"\n    API Response:")
    print(f"    {result[:800]}")
    
    # Check logs
    time.sleep(2)
    print("\n[3] OCR Logs:")
    stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | grep -i 'OCR' | tail -10")
    print(stdout.read().decode('utf-8', errors='replace'))
    
    # Check if text was extracted
    stdin, stdout, stderr = ssh.exec_command(f'''docker exec expertos-db psql -U expertos -c "SELECT \\\"ocrStatus\\\", LENGTH(extracted_text) as text_len FROM documents WHERE id = '{doc_id}';"''')
    print("\n[4] Document status after OCR:")
    print(stdout.read().decode('utf-8'))
    
else:
    print("\n  No PDF documents in database. Need to upload a document first.")
    
    # Check if files exist in uploads folder
    print("\n[2] PDF files in uploads folder:")
    stdin, stdout, stderr = ssh.exec_command("docker exec expertos-web find /app/public/uploads -name '*.pdf' 2>&1")
    print(stdout.read().decode('utf-8'))

ssh.close()
