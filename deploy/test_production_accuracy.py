#!/usr/bin/env python3
"""Test current production OCR and compare with reference"""
import subprocess, sys, os, json
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
try:
    import paramiko
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko

# Reference key phrases (from my visual analysis)
KEY_PHRASES = [
    ("أحمد بن سالم بن عبدالله البادي", "Plaintiff name"),
    ("شركة الجرادي وقيس الراشدي", "Law firm"),
    ("المحكمة الابتدائية بصور", "Court name"),
    ("الدائرة العمالية", "Labor division"),
    ("شركة بي اس أي مارين قلهات", "Defendant"),
    ("ولاية بوشر", "State"),
    ("غلا التجارية", "Area"),
    ("بناية أبراج النهضة", "Building"),
    ("مكتب رقم", "Office"),
    ("95788279", "Phone 1"),
    ("24502998", "Phone 2"),
    ("صحيفة دعوى افتتاحية", "Legal term"),
    ("REF2401040246", "Reference number"),
    ("قانون العمل", "Labor law"),
    ("المدعي", "Plaintiff term"),
    ("المدعى عليها", "Defendant term"),
]

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("193.233.233.217", username="root", password="3WP64PLwbT2Y", timeout=30)
print("[+] Connected!")

# Get current OCR result
print("\n[1] Getting current OCR result from production...")
stdin, stdout, stderr = ssh.exec_command('''docker exec expertos-db psql -U expertos -t -c "SELECT extracted_text FROM documents WHERE name = 'test_arabic.pdf' ORDER BY created_at DESC LIMIT 1;"''')
ocr_text = stdout.read().decode('utf-8', errors='replace').strip()

print(f"  Characters: {len(ocr_text)}")

# Check accuracy
print("\n[2] Checking accuracy against reference...")
found = 0
results = []
for phrase, desc in KEY_PHRASES:
    if phrase in ocr_text:
        found += 1
        results.append((desc, phrase, "OK"))
    else:
        results.append((desc, phrase, "MISS"))

accuracy = (found / len(KEY_PHRASES)) * 100
print(f"\n  ACCURACY: {accuracy:.1f}% ({found}/{len(KEY_PHRASES)} phrases)")

print("\n  Results:")
for desc, phrase, status in results:
    icon = "✅" if status == "OK" else "❌"
    print(f"  {icon} {desc}: {phrase[:30]}...")

# Show missing items - these need better post-processing
print("\n[3] Missing items (need improvement):")
for desc, phrase, status in results:
    if status == "MISS":
        print(f"  - {desc}: {phrase}")
        # Search for similar text
        words = phrase.split()
        for word in words:
            if len(word) > 3 and word in ocr_text:
                idx = ocr_text.find(word)
                context = ocr_text[max(0,idx-20):idx+len(word)+20]
                print(f"    Found '{word}' in: ...{context}...")

print("\n[4] First 1000 chars of OCR result:")
print("-" * 50)
print(ocr_text[:1000])

ssh.close()
