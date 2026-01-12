#!/usr/bin/env python3
"""Re-run OCR on test document and check accuracy"""
import subprocess, sys, time, json
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
try:
    import paramiko
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko

KEY_PHRASES = [
    ("أحمد بن سالم بن عبدالله البادي", "Plaintiff name"),
    ("شركة الجرادي وقيس الراشدي", "Law firm"),
    ("المحكمة الابتدائية بصور", "Court name"),
    ("شركة بي اس أي مارين قلهات", "Defendant"),
    ("95788279", "Phone 1"),
    ("REF2401040246", "Reference"),
]

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("193.233.233.217", username="root", password="3WP64PLwbT2Y", timeout=60, banner_timeout=60)
print("[+] Connected!")

# 1. Get document ID
print("\n[1] Getting document ID...")
stdin, stdout, stderr = ssh.exec_command('docker exec expertos-db psql -U expertos -t -c "SELECT id FROM documents WHERE name = \'test_arabic.pdf\' ORDER BY created_at DESC LIMIT 1;"', timeout=30)
doc_id = stdout.read().decode().strip()
print(f"  Document ID: {doc_id[:30]}...")

if doc_id:
    # 2. Reset OCR status
    print("\n[2] Resetting OCR status...")
    ssh.exec_command(f'''docker exec expertos-db psql -U expertos -c "UPDATE documents SET \\"ocrStatus\\" = 'PENDING', extracted_text = '' WHERE id = '{doc_id}';"''', timeout=30)
    print("  [OK]")
    
    # 3. Run OCR
    print("\n[3] Running OCR (this may take 30-60 seconds)...")
    stdin, stdout, stderr = ssh.exec_command(
        f'''curl -s -X POST http://localhost:3001/api/ocr -H "Content-Type: application/json" -d '{{"documentId":"{doc_id}"}}' ''',
        timeout=300
    )
    result = stdout.read().decode('utf-8', errors='replace')
    
    try:
        data = json.loads(result)
        if data.get('success'):
            text = data.get('document', {}).get('extractedText', '')
            
            # 4. Check accuracy
            found = 0
            print("\n[4] Checking accuracy:")
            for phrase, desc in KEY_PHRASES:
                if phrase in text:
                    found += 1
                    print(f"  ✅ {desc}")
                else:
                    print(f"  ❌ {desc}")
                    # Show what we found instead
                    words = phrase.split()
                    for w in words:
                        if len(w) > 4 and w in text:
                            idx = text.find(w)
                            context = text[max(0,idx-15):idx+len(w)+15]
                            print(f"     Found '{w}' in: ...{context}...")
            
            accuracy = (found / len(KEY_PHRASES)) * 100
            print(f"\n  🎯 FINAL ACCURACY: {accuracy:.1f}%")
            
            if accuracy == 100:
                print("  🎉 100% ACCURACY ACHIEVED!")
            elif accuracy >= 95:
                print("  ✅ Target 95%+ achieved!")
        else:
            print(f"  ❌ OCR Error: {data.get('error')}")
    except Exception as e:
        print(f"  Parse error: {e}")
        print(f"  Response: {result[:500]}")
else:
    print("  ❌ Document not found")

ssh.close()
