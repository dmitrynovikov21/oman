#!/usr/bin/env python3
"""Check server status and complete OCR deploy"""

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

# 1. Check container status
print("\n[1] Container status:")
stdin, stdout, stderr = ssh.exec_command("docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'")
print(stdout.read().decode('utf-8'))

# 2. Check if app is responding
print("[2] App health check:")
stdin, stdout, stderr = ssh.exec_command("curl -s -m 5 -o /dev/null -w '%{http_code}' http://localhost:3001/dashboard")
code = stdout.read().decode('utf-8').strip()
print(f"  Dashboard: HTTP {code}")

# 3. Check recent OCR logs
print("\n[3] Recent OCR-related logs:")
stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | grep -iE '(ocr|pdf|parse|extract)' | tail -10")
logs = stdout.read().decode('utf-8', errors='replace')
print(logs if logs.strip() else "  (no OCR logs found)")

# 4. Test OCR API directly
print("\n[4] Testing OCR API:")
stdin, stdout, stderr = ssh.exec_command('''docker exec expertos-db psql -U expertos -t -c "SELECT id, name FROM \\\"Document\\\" WHERE name LIKE '%.pdf' ORDER BY \\\"createdAt\\\" DESC LIMIT 1;"''')
doc_info = stdout.read().decode('utf-8').strip()
if doc_info:
    parts = doc_info.split('|')
    doc_id = parts[0].strip()
    doc_name = parts[1].strip() if len(parts) > 1 else "unknown"
    print(f"  Document: {doc_name} (ID: {doc_id})")
    
    stdin, stdout, stderr = ssh.exec_command(f'''curl -s -X POST http://localhost:3001/api/ocr -H "Content-Type: application/json" -d '{{"documentId":"{doc_id}"}}' 2>&1''')
    result = stdout.read().decode('utf-8', errors='replace')
    print(f"  API Response: {result[:600]}")
    
    # Check logs after request
    time.sleep(2)
    print("\n  Logs after OCR request:")
    stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | tail -8")
    print(stdout.read().decode('utf-8', errors='replace'))
else:
    print("  No PDF documents in database")

# 5. Check if pdfjs-dist is installed
print("\n[5] Checking pdfjs-dist installation:")
stdin, stdout, stderr = ssh.exec_command("docker exec expertos-web ls /app/node_modules/pdfjs-dist 2>&1 | head -5")
result = stdout.read().decode('utf-8')
if 'No such file' in result:
    print("  [!] pdfjs-dist NOT installed - need to rebuild")
else:
    print(f"  pdfjs-dist present: {result.strip()}")

ssh.close()
