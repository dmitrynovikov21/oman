#!/usr/bin/env python3
"""Check and fix analytics file directly on server"""

import subprocess, sys, os, time
os.environ["PYTHONIOENCODING"] = "utf-8"
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

try:
    import paramiko
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko

SERVER_IP = "193.233.233.217"
SERVER_USER = "root"
SERVER_PASS = "3WP64PLwbT2Y"
DEPLOY_DIR = "/var/www/expertos"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS, timeout=30)
print("[+] Connected!")

# Check analytics file on server
print("\n[1] Checking analytics/page.tsx on server (line 21)...")
stdin, stdout, stderr = ssh.exec_command(f"sed -n '21p' {DEPLOY_DIR}/app/app/\\(protected\\)/analytics/page.tsx")
line = stdout.read().decode('utf-8').strip()
print(f"  Line 21: {line}")

# Fix directly on server using sed
print("\n[2] Fixing monthlyData type on server...")
cmd = f'''sed -i 's/const monthlyData = \\[/const monthlyData: {{ month: string; cases: number; revenue: number }}[] = [/' {DEPLOY_DIR}/app/app/\\(protected\\)/analytics/page.tsx'''
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stderr.read().decode('utf-8'))

# Also fix casesByType 
print("\n[3] Fixing casesByType type on server...")
cmd = f'''sed -i 's/const casesByType = \\[/const casesByType: {{ type: string; count: number; percentage: number }}[] = [/' {DEPLOY_DIR}/app/app/\\(protected\\)/analytics/page.tsx'''
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stderr.read().decode('utf-8'))

# Fix recentPayments
print("\n[4] Fixing recentPayments type on server...")
cmd = f'''sed -i 's/const recentPayments = \\[/const recentPayments: {{ id: string; case: string; amount: number; date: string; status: string }}[] = [/' {DEPLOY_DIR}/app/app/\\(protected\\)/analytics/page.tsx'''
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stderr.read().decode('utf-8'))

# Verify
print("\n[5] Verifying fix...")
stdin, stdout, stderr = ssh.exec_command(f"sed -n '21,22p' {DEPLOY_DIR}/app/app/\\(protected\\)/analytics/page.tsx")
print(stdout.read().decode('utf-8'))

# Rebuild
print("\n[6] Rebuilding Docker image...")
start = time.time()
stdin, stdout, stderr = ssh.exec_command(
    f"cd {DEPLOY_DIR}/app && docker build -t expertos-web:latest . 2>&1 | tail -30",
    timeout=900
)
output = stdout.read().decode('utf-8', errors='replace')
elapsed = int(time.time() - start)

# Check
if "Successfully" in output:
    print(f"\n[OK] Built in {elapsed}s!")
    
    # Start container
    print("\n[7] Starting container...")
    ssh.exec_command("docker stop expertos-web 2>/dev/null; docker rm expertos-web 2>/dev/null || true")
    time.sleep(3)
    stdin, stdout, stderr = ssh.exec_command(f"cd {DEPLOY_DIR} && docker-compose up -d 2>&1")
    print(stdout.read().decode('utf-8', errors='replace')[:300])
    print(stderr.read().decode('utf-8', errors='replace')[:300])
    
    # Wait and verify
    print("\n[8] Verifying (20s wait)...")
    time.sleep(20)
    
    stdin, stdout, stderr = ssh.exec_command("curl -s -m 10 -o /dev/null -w '%{http_code}' http://localhost:3001")
    code = stdout.read().decode('utf-8').strip()
    print(f"HTTP Status: {code}")
    
    if code in ["200", "302", "307"]:
        print(f"\n{'='*60}")
        print("  SUCCESS! ExpertOS RUNNING!")
        print(f"  URL: http://{SERVER_IP}:3001")
        print("="*60)
else:
    print(f"\n[FAIL] Build failed after {elapsed}s")
    for line in output.split('\n'):
        if "error" in line.lower():
            print(line[:150])

ssh.close()
