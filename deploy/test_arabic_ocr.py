#!/usr/bin/env python3
"""Test improved Arabic OCR"""
import subprocess, sys, os, time, json
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

# Check ImageMagick
print("\n[1] Checking ImageMagick:")
stdin, stdout, stderr = ssh.exec_command("docker exec expertos-web convert --version 2>&1 | head -1")
print(f"  {stdout.read().decode('utf-8').strip()}")

# Find 1list.pdf
print("\n[2] Testing OCR on 1list.pdf:")
stdin, stdout, stderr = ssh.exec_command('docker exec expertos-db psql -U expertos -t -c "SELECT id FROM documents WHERE name LIKE \'%1list%\' ORDER BY created_at DESC LIMIT 1;"')
doc_id = stdout.read().decode('utf-8').strip()

if doc_id:
    print(f"  Document ID: {doc_id}")
    
    # Reset
    ssh.exec_command(f'''docker exec expertos-db psql -U expertos -c "UPDATE documents SET \\\"ocrStatus\\\" = 'PENDING', extracted_text = '' WHERE id = '{doc_id}';"''')
    
    print("  Running OCR (may take 1-2 minutes for Arabic)...")
    stdin, stdout, stderr = ssh.exec_command(f'''curl -s -X POST http://localhost:3001/api/ocr -H "Content-Type: application/json" -d '{{"documentId":"{doc_id}"}}' 2>&1''', timeout=300)
    result = stdout.read().decode('utf-8', errors='replace')
    
    try:
        data = json.loads(result)
        if data.get('success'):
            chars = data.get('stats', {}).get('characters', 0)
            text = data.get('document', {}).get('extractedText', '')
            
            print(f"  ✅ OCR SUCCESS!")
            print(f"  Characters: {chars}")
            print(f"\n  === EXTRACTED TEXT ===")
            print(text[:1500])
            print(f"  === END ===")
        else:
            print(f"  ❌ OCR FAILED: {data.get('error')}")
            if data.get('details'):
                print(f"  Details: {data.get('details')[:200]}")
    except:
        print(f"  Raw response: {result[:500]}")
    
    # Check logs
    time.sleep(2)
    print("\n[3] OCR Logs:")
    stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | grep -i 'OCR' | tail -15")
    print(stdout.read().decode('utf-8', errors='replace'))
else:
    print("  No 1list.pdf found")

print("\n  URL: http://193.233.233.217:3001")
ssh.close()
