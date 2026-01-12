#!/usr/bin/env python3
"""Deploy documents route fix"""
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

# Upload fixed file
print("\n[1/3] Uploading fixed documents route...")
sftp.put(os.path.join(LOCAL, "app", "api", "documents", "route.ts"), f"{DEPLOY_DIR}/app/app/api/documents/route.ts")
print("  [OK]")

# Rebuild
print("\n[2/3] Rebuilding Docker image...")
start = time.time()
stdin, stdout, stderr = ssh.exec_command(
    f"cd {DEPLOY_DIR}/app && docker build -t expertos-web:latest . 2>&1 | tail -15",
    timeout=600
)
output = stdout.read().decode('utf-8', errors='replace')
elapsed = int(time.time() - start)
print(f"  Build completed in {elapsed}s")

if "successfully" in output.lower():
    print("  [OK] Image built!")
    
    # Restart container
    print("\n[3/3] Restarting container...")
    ssh.exec_command("docker stop expertos-web; docker rm expertos-web")
    time.sleep(3)
    
    run_cmd = '''docker run -d \
      --name expertos-web \
      --restart always \
      --network expertos_default \
      -p 3001:3000 \
      -e DATABASE_URL="postgresql://expertos:ExpertOS2026SecurePass@db:5432/expertos" \
      -e NEXTAUTH_URL="http://193.233.233.217:3001" \
      -e NEXTAUTH_SECRET="ExpertOS2026SuperSecretKey1234567890abcdefghij" \
      -e AUTH_SECRET="ExpertOS2026SuperSecretKey1234567890abcdefghij" \
      -e AUTH_TRUST_HOST="true" \
      -e NEXT_PUBLIC_APP_URL="http://193.233.233.217:3001" \
      -e NODE_ENV="production" \
      -v expertos_uploads_data:/app/public/uploads \
      expertos-web:latest 2>&1'''
    
    stdin, stdout, stderr = ssh.exec_command(run_cmd)
    print(f"  Started: {stdout.read().decode()[:60]}")
    
    print("\n  Waiting 35s...")
    time.sleep(35)
    
    # Fix permissions again
    print("  Fixing uploads permissions...")
    ssh.exec_command("docker exec -u root expertos-web chown -R nextjs:nodejs /app/public/uploads")
    
    # Check health
    stdin, stdout, stderr = ssh.exec_command("curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/dashboard")
    code = stdout.read().decode('utf-8').strip()
    print(f"  Dashboard: HTTP {code}")
    
    if code == "200":
        print("\n  ✅ READY! Try uploading again.")
    else:
        stdin, stdout, stderr = ssh.exec_command("docker logs expertos-web 2>&1 | tail -20")
        print(f"\n  Logs:\n{stdout.read().decode('utf-8', errors='replace')}")
        
    print(f"\n  URL: http://{SERVER[0]}:3001")
else:
    print("  [FAIL]")
    print(output[-1000:])

sftp.close()
ssh.close()
