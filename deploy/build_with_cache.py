#!/usr/bin/env python3
"""Build without --no-cache to use cached layers"""
import subprocess, sys, os, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
try:
    import paramiko
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("193.233.233.217", username="root", password="3WP64PLwbT2Y", timeout=30)
sftp = ssh.open_sftp()
print("[+] Connected!")

# Check current container
print("\n[1] Current container status:")
stdin, stdout, stderr = ssh.exec_command("docker ps -a --format 'table {{.Names}}\\t{{.Status}}' | grep expertos")
print(stdout.read().decode('utf-8'))

# Try building WITH cache (will use previous successful layers)
print("\n[2] Building Docker image (with cache)...")
start = time.time()
stdin, stdout, stderr = ssh.exec_command(
    "cd /var/www/expertos/app && docker build -t expertos-web:latest . 2>&1 | tail -30",
    timeout=600
)
output = stdout.read().decode('utf-8', errors='replace')
elapsed = int(time.time() - start)
print(f"  Build completed in {elapsed}s")

if "successfully" in output.lower():
    print("  [OK] Image built!")
    
    # Restart
    print("\n[3] Restarting container...")
    ssh.exec_command("docker stop expertos-web; docker rm expertos-web")
    time.sleep(3)
    
    run_cmd = '''docker run -d --name expertos-web \
      --restart always --network expertos_default -p 3001:3000 \
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
    
    print("\n  Waiting 40s...")
    time.sleep(40)
    
    # Fix permissions
    ssh.exec_command("docker exec -u root expertos-web chown -R nextjs:nodejs /app/public/uploads")
    
    # Check health
    stdin, stdout, stderr = ssh.exec_command("curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/")
    code = stdout.read().decode().strip()
    print(f"  Health: HTTP {code}")
    
    if code in ["200", "302", "307"]:
        print("  ✅ Ready!")
    
else:
    print("  [FAIL] Build still fails")
    
    # Check if we can use existing image
    print("\n  Checking for existing working image...")
    stdin, stdout, stderr = ssh.exec_command("docker images expertos-web:latest --format '{{.ID}} {{.CreatedAt}}'")
    img = stdout.read().decode().strip()
    print(f"  Image: {img}")
    
    if img:
        print("\n  Using existing image, restarting container...")
        ssh.exec_command("docker stop expertos-web; docker rm expertos-web 2>/dev/null")
        time.sleep(2)
        
        run_cmd = '''docker run -d --name expertos-web \
          --restart always --network expertos_default -p 3001:3000 \
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
        
        time.sleep(35)
        ssh.exec_command("docker exec -u root expertos-web chown -R nextjs:nodejs /app/public/uploads")
        
        stdin, stdout, stderr = ssh.exec_command("curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/")
        print(f"  Health: HTTP {stdout.read().decode().strip()}")

print("\n  URL: http://193.233.233.217:3001")
sftp.close()
ssh.close()
