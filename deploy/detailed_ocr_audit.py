#!/usr/bin/env python3
"""Get full OCR result from server and analyze critical data points"""
import subprocess, sys, re
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
try:
    import paramiko
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko

# Critical data points to check (from the image)
CRITICAL_DATA = {
    "salary": {
        "expected": "١٠٤٣",  # 1043 in Arabic numerals
        "expected_latin": "1043",
        "description": "Salary (OMR)"
    },
    "law_article": {
        "expected": "١٠٧",  # 107
        "expected_latin": "107",
        "description": "Law Article"
    },
    "cr_number": {
        "expected": "١٢٠٤٦٩٣",  # 1204693
        "expected_latin": "1204693",
        "description": "Commercial Registration"
    },
    "phone_rep": {
        "expected": "95788279",
        "description": "Representative Phone"
    },
    "phone_def": {
        "expected": "93216388",
        "description": "Defendant Phone"
    },
    "ref_number": {
        "expected": "REF2401040246",
        "description": "Reference Number"
    }
}

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("193.233.233.217", username="root", password="3WP64PLwbT2Y", timeout=60, banner_timeout=60)
print("[+] Connected!")

# Get full OCR result
print("\n[1] Getting full OCR result from database...")
stdin, stdout, stderr = ssh.exec_command('''docker exec expertos-db psql -U expertos -t -c "SELECT extracted_text FROM documents WHERE name LIKE '%test_arabic%' OR name LIKE '%أحمد%' ORDER BY created_at DESC LIMIT 1;"''', timeout=30)
ocr_text = stdout.read().decode('utf-8', errors='replace').strip()

print(f"  Total characters: {len(ocr_text)}")

# Check each critical data point
print("\n[2] CRITICAL DATA AUDIT:")
print("=" * 60)

results = []
for key, data in CRITICAL_DATA.items():
    expected = data['expected']
    desc = data['description']
    
    # Check if expected value is in OCR text
    found = expected in ocr_text
    
    # Also check Latin version if available
    if 'expected_latin' in data and not found:
        found = data['expected_latin'] in ocr_text
        if found:
            expected = data['expected_latin']
    
    if found:
        # Find context around the match
        idx = ocr_text.find(expected)
        context = ocr_text[max(0, idx-30):idx+len(expected)+30]
        context = context.replace('\n', ' ').strip()
        results.append((desc, expected, "✅ FOUND", context))
    else:
        # Try to find similar patterns
        results.append((desc, expected, "❌ NOT FOUND", ""))
        
        # Search for partial matches
        if len(expected) > 3:
            for i in range(len(ocr_text) - 3):
                if ocr_text[i:i+3] == expected[:3]:
                    context = ocr_text[max(0, i-10):i+20]
                    print(f"  Possible match for {desc}: ...{context}...")

# Print results
print()
for desc, expected, status, context in results:
    print(f"  {status} {desc}")
    print(f"     Expected: {expected}")
    if context:
        print(f"     Context: ...{context[:60]}...")
    print()

# Count accuracy
found_count = sum(1 for r in results if "FOUND" in r[2])
total = len(results)
accuracy = (found_count / total) * 100

print("=" * 60)
print(f"  CRITICAL DATA ACCURACY: {accuracy:.1f}% ({found_count}/{total})")

# Output first 2000 chars of OCR for manual review
print("\n[3] FIRST 2000 CHARS OF OCR RESULT:")
print("-" * 60)
print(ocr_text[:2000])

ssh.close()
