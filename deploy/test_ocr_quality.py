#!/usr/bin/env python3
"""Upload test PDF and analyze OCR quality"""
import subprocess, sys, os, time, json
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
try:
    import paramiko
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko

# Test file path
TEST_FILE = r"c:\gravity\gravity\oman-auto-new\filesfortest1\أحمد سالم عبدالله البادي-1-2111.pdf"
SERVER = ("193.233.233.217", "root", "3WP64PLwbT2Y")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(SERVER[0], username=SERVER[1], password=SERVER[2], timeout=30)
sftp = ssh.open_sftp()
print("[+] Connected!")

# 1. Upload test file to server
print("\n[1] Uploading test PDF to server...")
remote_test_dir = "/tmp/ocr_test"
ssh.exec_command(f"mkdir -p {remote_test_dir}")
time.sleep(1)

remote_file = f"{remote_test_dir}/test_arabic.pdf"
sftp.put(TEST_FILE, remote_file)
print(f"  Uploaded: {os.path.basename(TEST_FILE)}")

# 2. Convert to image and run local OCR to see quality
print("\n[2] Testing OCR quality on server...")

# Create test case and document in DB
print("  Creating test document in database...")
create_doc = '''
docker exec expertos-db psql -U expertos -c "
INSERT INTO cases (id, case_number, year, status, created_at, updated_at)
VALUES ('ocr_test_case', 'OCR-TEST-001', 2026, 'ACTIVE', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
"
'''
ssh.exec_command(create_doc)
time.sleep(1)

# Copy file to uploads and create document record
ssh.exec_command(f"mkdir -p /var/lib/docker/volumes/expertos_uploads_data/_data/ocr_test_case")
ssh.exec_command(f"cp {remote_file} /var/lib/docker/volumes/expertos_uploads_data/_data/ocr_test_case/test_arabic.pdf")
ssh.exec_command("docker exec -u root expertos-web mkdir -p /app/public/uploads/ocr_test_case")
ssh.exec_command(f"docker cp {remote_file} expertos-web:/app/public/uploads/ocr_test_case/test_arabic.pdf")
time.sleep(2)

# Create document record
create_doc_sql = '''
docker exec expertos-db psql -U expertos -c "
INSERT INTO documents (id, case_id, name, original_name, file_path, file_size, mime_type, type, \\\"ocrStatus\\\", created_at, updated_at)
VALUES (
    'ocr_test_doc_' || EXTRACT(EPOCH FROM NOW())::int,
    'ocr_test_case',
    'test_arabic.pdf',
    'أحمد سالم عبدالله البادي-1-2111.pdf',
    '/uploads/ocr_test_case/test_arabic.pdf',
    1000000,
    'application/pdf',
    'EVIDENCE',
    'PENDING',
    NOW(),
    NOW()
)
RETURNING id;
"
'''
stdin, stdout, stderr = ssh.exec_command(create_doc_sql)
output = stdout.read().decode('utf-8')
print(f"  Document created: {output.strip()}")

# Get document ID
stdin, stdout, stderr = ssh.exec_command('docker exec expertos-db psql -U expertos -t -c "SELECT id FROM documents WHERE name = \'test_arabic.pdf\' ORDER BY created_at DESC LIMIT 1;"')
doc_id = stdout.read().decode('utf-8').strip()
print(f"  Document ID: {doc_id}")

if doc_id:
    # 3. Run OCR
    print("\n[3] Running optimized OCR (this may take 1-2 minutes)...")
    start = time.time()
    stdin, stdout, stderr = ssh.exec_command(f'''curl -s -X POST http://localhost:3001/api/ocr -H "Content-Type: application/json" -d '{{"documentId":"{doc_id}"}}' 2>&1''', timeout=300)
    result = stdout.read().decode('utf-8', errors='replace')
    elapsed = int(time.time() - start)
    
    print(f"  OCR completed in {elapsed}s")
    
    try:
        data = json.loads(result)
        if data.get('success'):
            chars = data.get('stats', {}).get('characters', 0)
            pages = data.get('stats', {}).get('pages', 1)
            text = data.get('document', {}).get('extractedText', '')
            
            print(f"\n  ✅ OCR SUCCESS!")
            print(f"  Pages: {pages}")
            print(f"  Characters: {chars}")
            print(f"\n{'='*70}")
            print("EXTRACTED TEXT (FULL):")
            print('='*70)
            print(text)
            print('='*70)
            
            # Save to file for comparison
            with open("ocr_result.txt", "w", encoding="utf-8") as f:
                f.write(text)
            print("\n  Saved to ocr_result.txt for comparison")
        else:
            print(f"  ❌ OCR FAILED: {data.get('error')}")
            print(f"  Details: {data.get('details', '')[:300]}")
    except Exception as e:
        print(f"  Error: {e}")
        print(f"  Response: {result[:500]}")
    
    # Show logs
    print("\n[4] OCR Processing logs:")
    stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | grep -i 'OCR' | tail -15")
    print(stdout.read().decode('utf-8', errors='replace'))
else:
    print("  [!] Could not create document")

sftp.close()
ssh.close()
