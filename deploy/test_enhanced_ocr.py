#!/usr/bin/env python3
"""Test Enhanced OCR - using Python requests from host"""
import sys, time, json
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
try:
    import paramiko
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko

CRITICAL_FIELDS = {
    "salary": ["1043", "١٠٤٣"],
    "phone_rep": ["95788279"],
    "phone_def": ["93216388"],
    "reference": ["REF2401040246"],
    "cr_number": ["1204693", "١٢٠٤٦٩٣"],
    "plaintiff": ["أحمد بن سالم بن عبدالله البادي"],
    "defendant": ["بي اس آي مارين", "مارين قلهات", "بي اس أي"],
}

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("193.233.233.217", username="root", password="3WP64PLwbT2Y", timeout=60, banner_timeout=60)
print("[OK] Connected!")

# Create test script on server
print("\n[1/3] Creating test script on server...")
test_script = '''
import requests
import json
import sys

# Find test file
import os
test_dir = "/var/www/expertos/app/public/uploads"
test_pdf = None
for root, dirs, files in os.walk(test_dir):
    for f in files:
        if f.endswith(".pdf"):
            test_pdf = os.path.join(root, f)
            break
    if test_pdf:
        break

if not test_pdf:
    print("No PDF found")
    sys.exit(1)

print(f"Testing: {test_pdf}")

# Read PDF and send as base64
import base64
with open(test_pdf, "rb") as f:
    pdf_b64 = base64.b64encode(f.read()).decode()

# Send to OCR service
response = requests.post(
    "http://localhost:5001/ocr",
    json={"image": pdf_b64, "filename": "test.pdf"},
    timeout=300
)

data = response.json()
print(json.dumps(data, ensure_ascii=False, indent=2))
'''

# Write script
sftp = ssh.open_sftp()
with sftp.file("/tmp/test_ocr.py", "w") as f:
    f.write(test_script)
print("  [OK]")

# Run test
print("\n[2/3] Running OCR test (this may take 2-3 minutes)...")
stdin, stdout, stderr = ssh.exec_command("cd /tmp && python3 test_ocr.py 2>&1", timeout=600)
result = stdout.read().decode('utf-8', errors='replace')
print(result[:500])

# Try to parse result
print("\n[3/3] Analyzing results...")
try:
    # Find JSON in output
    json_start = result.find('{')
    if json_start >= 0:
        json_str = result[json_start:]
        data = json.loads(json_str)
        
        if data.get('success'):
            text = data.get('text', '')
            print(f"  Text length: {len(text)} chars")
            
            # Check critical fields
            found = 0
            total = len(CRITICAL_FIELDS)
            
            for field_name, expected_values in CRITICAL_FIELDS.items():
                field_found = False
                found_value = None
                
                for exp in expected_values:
                    if exp in text:
                        field_found = True
                        found_value = exp
                        break
                
                if field_found:
                    print(f"  [OK] {field_name}: '{found_value}'")
                    found += 1
                else:
                    print(f"  [FAIL] {field_name}: NOT FOUND")
            
            accuracy = (found / total) * 100
            print(f"\n  ACCURACY: {accuracy:.1f}% ({found}/{total})")
            
            if accuracy >= 95:
                print("\n  [TARGET ACHIEVED!]")
            elif accuracy >= 80:
                print("\n  [CLOSE TO TARGET]")
            else:
                print("\n  [NEEDS IMPROVEMENT]")
        else:
            print(f"  [FAIL] OCR Error: {data.get('error')}")
except Exception as e:
    print(f"  Parse error: {e}")
    print(f"  Full output: {result}")

sftp.close()
ssh.close()
