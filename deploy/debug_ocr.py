#!/usr/bin/env python3
"""Debug OCR failure"""

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

# 1. Check recent server logs for OCR/PDF errors
print("="*60)
print("  [1] Recent OCR/PDF errors in logs")
print("="*60)
stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | grep -iE '(ocr|pdf|parse|extract|error)' | tail -20")
print(stdout.read().decode('utf-8', errors='replace'))

# 2. Check if pdf-parse exists and has index.js
print("="*60)
print("  [2] pdf-parse module structure")
print("="*60)
stdin, stdout, stderr = ssh.exec_command("docker exec expertos-web ls -la /app/node_modules/pdf-parse/ 2>&1")
print(stdout.read().decode('utf-8', errors='replace'))

# 3. Check if file exists in uploads
print("="*60)
print("  [3] Looking for receipt PDF in uploads")
print("="*60)
stdin, stdout, stderr = ssh.exec_command("docker exec expertos-web find /app/public/uploads -name '*receipt*' -o -name '*.pdf' 2>&1 | head -10")
print(stdout.read().decode('utf-8', errors='replace'))

# 4. Check document records in DB
print("="*60)
print("  [4] Documents in database")
print("="*60)
stdin, stdout, stderr = ssh.exec_command('''docker exec expertos-db psql -U expertos -c "SELECT id, name, \"filePath\", \"ocrStatus\" FROM \"Document\" ORDER BY \"createdAt\" DESC LIMIT 5;"''')
print(stdout.read().decode('utf-8', errors='replace'))

# 5. Try to test OCR API directly with a real document ID
print("="*60)
print("  [5] Getting real document ID from database")
print("="*60)
stdin, stdout, stderr = ssh.exec_command('''docker exec expertos-db psql -U expertos -t -c "SELECT id FROM \\\"Document\\\" WHERE name LIKE '%receipt%' LIMIT 1;"''')
doc_id = stdout.read().decode('utf-8').strip()
print(f"  Document ID: {doc_id}")

if doc_id:
    print("\n  Testing OCR API with this document...")
    stdin, stdout, stderr = ssh.exec_command(f'''curl -s -X POST http://localhost:3001/api/ocr -H "Content-Type: application/json" -d '{{"documentId":"{doc_id}"}}' 2>&1''')
    result = stdout.read().decode('utf-8', errors='replace')
    print(f"  API Response: {result[:500]}")
    
    # Check logs after OCR attempt
    print("\n  Latest logs after OCR attempt:")
    stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | tail -10")
    print(stdout.read().decode('utf-8', errors='replace'))

ssh.close()
