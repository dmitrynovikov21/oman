#!/usr/bin/env python3
"""Start build in background and check later"""
import subprocess, sys, time, json
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
try:
    import paramiko
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("193.233.233.217", username="root", password="3WP64PLwbT2Y", timeout=60, banner_timeout=60)
print("[+] Connected!")

# Check if build is running
print("\n[1] Checking for running builds...")
stdin, stdout, stderr = ssh.exec_command("ps aux | grep 'docker build' | grep -v grep", timeout=10)
ps = stdout.read().decode()
if ps:
    print("  Build already running:")
    print(ps[:200])
else:
    print("  No active build. Starting build in background...")
    
    # Start build in background with nohup
    ssh.exec_command(
        "nohup bash -c 'cd /var/www/expertos/app && docker build --no-cache -t expertos-web:latest . > /tmp/build.log 2>&1 && echo DONE >> /tmp/build.log' &",
        timeout=10
    )
    print("  Build started! Check /tmp/build.log for progress.")

# Wait and check build log
print("\n[2] Waiting 30s and checking build progress...")
time.sleep(30)

stdin, stdout, stderr = ssh.exec_command("tail -20 /tmp/build.log 2>/dev/null", timeout=10)
log = stdout.read().decode('utf-8', errors='replace')
print(log)

# Check if build completed
if "DONE" in log or "Successfully" in log:
    print("\n[3] Build completed! Restarting container...")
    
    ssh.exec_command("docker stop expertos-web; docker rm expertos-web", timeout=30)
    time.sleep(3)
    
    run_cmd = '''docker run -d --name expertos-web --restart always --network expertos_default -p 3001:3000 \
      -e DATABASE_URL="postgresql://expertos:ExpertOS2026SecurePass@db:5432/expertos" \
      -e NEXTAUTH_URL="http://193.233.233.217:3001" \
      -e NEXTAUTH_SECRET="ExpertOS2026SuperSecretKey1234567890abcdefghij" \
      -e AUTH_SECRET="ExpertOS2026SuperSecretKey1234567890abcdefghij" \
      -e AUTH_TRUST_HOST="true" \
      -e NODE_ENV="production" \
      -v expertos_uploads_data:/app/public/uploads \
      expertos-web:latest'''
    ssh.exec_command(run_cmd)
    print("  Container started!")
    
    print("\n  Waiting 45s...")
    time.sleep(45)
    ssh.exec_command("docker exec -u root expertos-web chown -R nextjs:nodejs /app/public/uploads", timeout=30)
    
    print("[4] Done! Run ssh_retry.py to test OCR accuracy.")
else:
    print("\n  Build still in progress. Run this script again in a few minutes.")

ssh.close()
