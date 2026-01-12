#!/usr/bin/env python3
"""Quick check and rebuild"""
import subprocess, sys, json
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
ssh.connect("193.233.233.217", username="root", password="3WP64PLwbT2Y", timeout=30)
print("[+] Connected!")

# Check container
print("\n[1] Container status:")
stdin, stdout, stderr = ssh.exec_command("docker ps --format 'table {{.Names}}\t{{.Status}}' | grep expertos")
print(stdout.read().decode('utf-8'))

# Check if container is running
stdin, stdout, stderr = ssh.exec_command("curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/")
code = stdout.read().decode().strip()
print(f"[2] HTTP Status: {code}")

if code in ["200", "302", "307"]:
    print("\n[3] Testing OCR accuracy...")
    stdin, stdout, stderr = ssh.exec_command('docker exec expertos-db psql -U expertos -t -c "SELECT extracted_text FROM documents WHERE name = \'test_arabic.pdf\' ORDER BY created_at DESC LIMIT 1;"')
    text = stdout.read().decode('utf-8', errors='replace').strip()
    
    found = 0
    for phrase, desc in KEY_PHRASES:
        if phrase in text:
            found += 1
            print(f"  ✅ {desc}")
        else:
            print(f"  ❌ {desc}")
    
    accuracy = (found / len(KEY_PHRASES)) * 100
    print(f"\n  QUICK CHECK: {accuracy:.1f}%")
else:
    print("\n[!] Container not responding, rebuilding...")
    print("  This may take 3-5 minutes...")

ssh.close()
