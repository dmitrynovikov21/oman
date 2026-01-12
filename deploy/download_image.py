#!/usr/bin/env python3
"""Download converted image from server for comparison"""
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
sftp = ssh.open_sftp()
print("[+] Connected!")

# Convert PDF to image on server
print("\n[1] Converting PDF to image on server...")
ssh.exec_command("mkdir -p /tmp/ocr_compare")

# Convert first page
stdin, stdout, stderr = ssh.exec_command(
    "pdftoppm -png -r 300 -f 1 -l 1 /tmp/ocr_test/test_arabic.pdf /tmp/ocr_compare/page 2>&1",
    timeout=60
)
print(stdout.read().decode('utf-8', errors='replace'))

# Check created files
stdin, stdout, stderr = ssh.exec_command("ls -la /tmp/ocr_compare/")
print(stdout.read().decode('utf-8'))

# Download image
print("\n[2] Downloading image...")
local_path = r"c:\gravity\gravity\expertos\deploy\test_page_1.png"
try:
    sftp.get("/tmp/ocr_compare/page-1.png", local_path)
    print(f"  Downloaded to: {local_path}")
except Exception as e:
    print(f"  Error: {e}")
    # Try alternative name
    try:
        sftp.get("/tmp/ocr_compare/page-01.png", local_path)
        print(f"  Downloaded (alt) to: {local_path}")
    except Exception as e2:
        print(f"  Alt error: {e2}")

# Also get the OCR result text
print("\n[3] Getting OCR result text...")
stdin, stdout, stderr = ssh.exec_command('''docker exec expertos-db psql -U expertos -t -c "SELECT extracted_text FROM documents WHERE name = 'test_arabic.pdf' ORDER BY created_at DESC LIMIT 1;"''')
ocr_text = stdout.read().decode('utf-8', errors='replace').strip()

# Save to file
with open(r"c:\gravity\gravity\expertos\deploy\ocr_result.txt", "w", encoding="utf-8") as f:
    f.write(ocr_text)
print(f"  Saved OCR result: {len(ocr_text)} chars")

sftp.close()
ssh.close()
print("\n[DONE] Files ready for comparison")
