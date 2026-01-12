#!/usr/bin/env python3
"""Clean Docker and deploy"""
import subprocess, sys, os, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
try:
    import paramiko
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko

SERVER = ("193.233.233.217", "root", "3WP64PLwbT2Y")
DEPLOY_DIR = "/var/www/expertos"
LOCAL = r"c:\gravity\gravity\expertos"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(SERVER[0], username=SERVER[1], password=SERVER[2], timeout=30)
sftp = ssh.open_sftp()
print("[+] Connected!")

# Clean Docker
print("\n[1/4] Cleaning Docker cache...")
stdin, stdout, stderr = ssh.exec_command("docker system prune -af --volumes 2>&1 | tail -5")
print(stdout.read().decode('utf-8'))

print("  Checking disk space:")
stdin, stdout, stderr = ssh.exec_command("df -h / | tail -1")
print(f"  {stdout.read().decode('utf-8')}")

# Upload files
print("\n[2/4] Uploading files...")
files = [
    ("Dockerfile", f"{DEPLOY_DIR}/app/Dockerfile"),
    ("next.config.js", f"{DEPLOY_DIR}/app/next.config.js"),
    ("app/api/ocr/route.ts", f"{DEPLOY_DIR}/app/app/api/ocr/route.ts"),
    ("prisma/schema.prisma", f"{DEPLOY_DIR}/app/prisma/schema.prisma"),
]
for local_path, remote_path in files:
    sftp.put(os.path.join(LOCAL, local_path.replace('/', os.sep)), remote_path)
    print(f"  - {local_path}")

# Rebuild
print("\n[3/4] Rebuilding Docker image...")
start = time.time()
stdin, stdout, stderr = ssh.exec_command(
    f"cd {DEPLOY_DIR}/app && docker build -t expertos-web:latest . 2>&1 | tail -25",
    timeout=1200
)
output = stdout.read().decode('utf-8', errors='replace')
elapsed = int(time.time() - start)
print(f"  Build completed in {elapsed}s")

if "successfully" in output.lower():
    print("  [OK] Image built!")
    
    # Also need to rebuild postgres (it was pruned)
    print("\n[4/4] Restarting containers...")
    stdin, stdout, stderr = ssh.exec_command(f"cd {DEPLOY_DIR} && docker-compose up -d 2>&1")
    print(stdout.read().decode('utf-8', errors='replace')[:300])
    
    print("\n  Waiting 45s...")
    time.sleep(45)
    
    # Verify
    stdin, stdout, stderr = ssh.exec_command("docker ps --format 'table {{.Names}}\\t{{.Status}}' | grep expertos")
    print(f"  Containers:\n{stdout.read().decode('utf-8')}")
    
    # Dashboard check
    stdin, stdout, stderr = ssh.exec_command("curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/dashboard")
    print(f"  Dashboard: HTTP {stdout.read().decode('utf-8')}")
    
    # Test OCR
    print("\n  Testing OCR...")
    stdin, stdout, stderr = ssh.exec_command('docker exec expertos-db psql -U expertos -t -c "SELECT id FROM documents WHERE name = \'1list.pdf\' ORDER BY created_at DESC LIMIT 1;"')
    doc_id = stdout.read().decode('utf-8').strip()
    
    if doc_id:
        ssh.exec_command(f'''docker exec expertos-db psql -U expertos -c "UPDATE documents SET \\\"ocrStatus\\\" = 'PENDING', extracted_text = '' WHERE id = '{doc_id}';"''')
        
        stdin, stdout, stderr = ssh.exec_command(f'''curl -s -X POST http://localhost:3001/api/ocr -H "Content-Type: application/json" -d '{{"documentId":"{doc_id}"}}' 2>&1''', timeout=180)
        result = stdout.read().decode('utf-8', errors='replace')
        print(f"  OCR Response: {result[:600]}")
    
    print(f"\n  URL: http://{SERVER[0]}:3001")
else:
    print("  [FAIL] Build error:")
    print(output[-1200:])

sftp.close()
ssh.close()
