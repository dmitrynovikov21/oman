#!/usr/bin/env python3
"""Final OCR verification - test multiple documents"""
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
print("[+] Connected to production server!")
print("="*70)
print("FINAL OCR VERIFICATION - MULTIPLE DOCUMENTS")
print("="*70)

# Get all PDF documents
stdin, stdout, stderr = ssh.exec_command('docker exec expertos-db psql -U expertos -t -c "SELECT id, name FROM documents WHERE name LIKE \'%.pdf\' AND file_path IS NOT NULL;"')
docs = stdout.read().decode('utf-8').strip().split('\n')

print(f"\nFound {len([d for d in docs if d.strip()])} PDF documents to test\n")

ocr_results = []

for doc in docs:
    if not doc.strip():
        continue
    
    parts = doc.split('|')
    doc_id = parts[0].strip()
    doc_name = parts[1].strip() if len(parts) > 1 else "unknown"
    
    print(f"Testing: {doc_name[:40]}...")
    
    # Reset status
    ssh.exec_command(f'''docker exec expertos-db psql -U expertos -c "UPDATE documents SET \\\"ocrStatus\\\" = 'PENDING', extracted_text = '' WHERE id = '{doc_id}';"''')
    
    # Call OCR API
    stdin, stdout, stderr = ssh.exec_command(f'''curl -s -X POST http://localhost:3001/api/ocr -H "Content-Type: application/json" -d '{{"documentId":"{doc_id}"}}' 2>&1''', timeout=120)
    result = stdout.read().decode('utf-8', errors='replace')
    
    try:
        data = json.loads(result)
        if data.get('success'):
            chars = data.get('stats', {}).get('characters', 0)
            pages = data.get('stats', {}).get('pages', 0)
            status = "✅ SUCCESS"
            ocr_results.append((doc_name, True, chars))
            print(f"  {status} - {chars} chars, {pages} pages")
        else:
            error = data.get('error', 'unknown')
            status = "❌ FAILED"
            ocr_results.append((doc_name, False, error))
            print(f"  {status} - {error[:50]}")
    except Exception as e:
        ocr_results.append((doc_name, False, str(e)))
        print(f"  ❌ ERROR - {str(e)[:50]}")

# Summary
print("\n" + "="*70)
print("OCR TEST RESULTS SUMMARY")
print("="*70)

success = sum(1 for _, r, _ in ocr_results if r)
total = len(ocr_results)
print(f"\n  Total Documents: {total}")
print(f"  Successfully Processed: {success}")
print(f"  Failed: {total - success}")
print(f"  Success Rate: {success/total*100:.1f}%" if total > 0 else "  No documents")

# Show failed ones
if total - success > 0:
    print(f"\n  Failed documents:")
    for name, success_flag, details in ocr_results:
        if not success_flag:
            print(f"    - {name[:30]}: {details[:40]}")

# Show extracted text sample from one successful doc
successful = [(n, c) for n, s, c in ocr_results if s and isinstance(c, int) and c > 0]
if successful:
    print(f"\n  Sample extraction ({successful[0][0][:30]}):")
    doc_name_sample = successful[0][0]
    stdin, stdout, stderr = ssh.exec_command(f'''docker exec expertos-db psql -U expertos -t -c "SELECT SUBSTRING(extracted_text, 1, 200) FROM documents WHERE name = '{doc_name_sample}' LIMIT 1;"''')
    sample = stdout.read().decode('utf-8', errors='replace').strip()
    print(f"    '{sample[:150]}...'")

print(f"\n  URL: http://193.233.233.217:3001")
print("="*70)

ssh.close()
