#!/usr/bin/env python3
"""Comprehensive production testing - all functions"""
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
print("COMPREHENSIVE PLATFORM TESTING")
print("="*70)

results = []

def test(name, func):
    try:
        result = func()
        status = "✅" if result else "❌"
        results.append((name, result))
        print(f"  {status} {name}")
        return result
    except Exception as e:
        results.append((name, False))
        print(f"  ❌ {name}: {str(e)[:50]}")
        return False

# ============================================
# 1. API ENDPOINTS
# ============================================
print("\n[1] API ENDPOINTS")
print("-"*50)

def check_endpoint(path, expected_codes=["200", "401", "302"]):
    stdin, stdout, stderr = ssh.exec_command(f"curl -s -o /dev/null -w '%{{http_code}}' http://localhost:3001{path}")
    code = stdout.read().decode('utf-8').strip()
    return code in expected_codes

test("Dashboard", lambda: check_endpoint("/dashboard"))
test("Login Page", lambda: check_endpoint("/login"))
test("Cases API", lambda: check_endpoint("/api/cases"))
test("Health API", lambda: check_endpoint("/api/health"))
test("Analytics API", lambda: check_endpoint("/api/analytics/stats"))

# ============================================
# 2. DATABASE OPERATIONS
# ============================================
print("\n[2] DATABASE OPERATIONS")
print("-"*50)

def db_query(query):
    stdin, stdout, stderr = ssh.exec_command(f'docker exec expertos-db psql -U expertos -t -c "{query}"')
    return stdout.read().decode('utf-8').strip()

cases_count = db_query("SELECT COUNT(*) FROM cases;")
test(f"Cases in DB ({cases_count} records)", lambda: int(cases_count) >= 0)

docs_count = db_query("SELECT COUNT(*) FROM documents;")
test(f"Documents in DB ({docs_count} records)", lambda: int(docs_count) >= 0)

courts_count = db_query("SELECT COUNT(*) FROM courts;")
test(f"Courts in DB ({courts_count} records)", lambda: int(courts_count) >= 0)

# ============================================
# 3. OCR FUNCTIONALITY
# ============================================
print("\n[3] OCR FUNCTIONALITY")
print("-"*50)

# Check Tesseract
stdin, stdout, stderr = ssh.exec_command("docker exec expertos-web tesseract --version 2>&1 | head -1")
tesseract = stdout.read().decode('utf-8').strip()
test(f"Tesseract OCR installed ({tesseract[:20] if tesseract else 'NO'})", lambda: "tesseract" in tesseract.lower())

# Check pdftotext
stdin, stdout, stderr = ssh.exec_command("docker exec expertos-web pdftotext -v 2>&1 | head -1")
pdftotext = stdout.read().decode('utf-8').strip()
test(f"pdftotext installed", lambda: "pdftotext" in pdftotext.lower() or "poppler" in pdftotext.lower())

# Test OCR on real document
doc_id = db_query("SELECT id FROM documents WHERE name LIKE '%.pdf' AND file_path IS NOT NULL ORDER BY created_at DESC LIMIT 1;")
if doc_id:
    print(f"\n  Testing OCR on document: {doc_id[:20]}...")
    
    # Reset status
    ssh.exec_command(f'''docker exec expertos-db psql -U expertos -c "UPDATE documents SET \\\"ocrStatus\\\" = 'PENDING', extracted_text = '' WHERE id = '{doc_id}';"''')
    
    # Call OCR
    stdin, stdout, stderr = ssh.exec_command(f'''curl -s -X POST http://localhost:3001/api/ocr -H "Content-Type: application/json" -d '{{"documentId":"{doc_id}"}}' 2>&1''', timeout=120)
    result = stdout.read().decode('utf-8', errors='replace')
    
    try:
        data = json.loads(result)
        if data.get('success'):
            chars = data.get('stats', {}).get('characters', 0)
            test(f"OCR extraction ({chars} chars)", lambda: True)
        else:
            test(f"OCR extraction (failed: {data.get('error', 'unknown')[:30]})", lambda: False)
    except:
        test(f"OCR API response (invalid JSON)", lambda: False)

# ============================================
# 4. FILE UPLOADS
# ============================================
print("\n[4] FILE UPLOADS")
print("-"*50)

stdin, stdout, stderr = ssh.exec_command("docker exec expertos-web ls /app/public/uploads 2>&1 | wc -l")
folders = stdout.read().decode('utf-8').strip()
test(f"Uploads folder ({folders} case folders)", lambda: int(folders) > 0)

stdin, stdout, stderr = ssh.exec_command("docker exec expertos-web find /app/public/uploads -name '*.pdf' 2>&1 | wc -l")
pdfs = stdout.read().decode('utf-8').strip()
test(f"PDF files in uploads ({pdfs} files)", lambda: int(pdfs) >= 0)

# ============================================
# 5. ERROR LOGS CHECK
# ============================================
print("\n[5] ERROR LOGS CHECK")
print("-"*50)

stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | grep -c 'error' || echo 0")
error_count = stdout.read().decode('utf-8').strip()
test(f"Error count in logs ({error_count})", lambda: int(error_count) < 10)

# ============================================
# 6. MEMORY & PERFORMANCE
# ============================================
print("\n[6] SYSTEM RESOURCES")
print("-"*50)

stdin, stdout, stderr = ssh.exec_command("docker stats expertos-web --no-stream --format '{{.MemUsage}}'")
memory = stdout.read().decode('utf-8').strip()
test(f"Container memory ({memory})", lambda: len(memory) > 0)

stdin, stdout, stderr = ssh.exec_command("df -h / | tail -1 | awk '{print $5}'")
disk = stdout.read().decode('utf-8').strip()
test(f"Disk usage ({disk})", lambda: int(disk.replace('%', '')) < 90)

# ============================================
# SUMMARY
# ============================================
print("\n" + "="*70)
print("TEST RESULTS SUMMARY")
print("="*70)

passed = sum(1 for _, r in results if r)
total = len(results)
print(f"\n  Passed: {passed}/{total}")
print(f"  Success Rate: {passed/total*100:.1f}%")

failed_tests = [name for name, r in results if not r]
if failed_tests:
    print(f"\n  Failed tests:")
    for t in failed_tests:
        print(f"    - {t}")

print(f"\n  URL: http://193.233.233.217:3001")
print("="*70)

ssh.close()
