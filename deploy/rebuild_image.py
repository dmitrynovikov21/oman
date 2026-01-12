#!/usr/bin/env python3
"""Rebuild Docker image after uploading missing files"""

import subprocess, sys, os, time
os.environ["PYTHONIOENCODING"] = "utf-8"

try:
    import paramiko
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko

SERVER_IP = "193.233.233.217"
SERVER_USER = "root"
SERVER_PASS = "3WP64PLwbT2Y"
DEPLOY_DIR = "/var/www/expertos"

def run_ssh(ssh, cmd, desc="", timeout=900):
    print(f"[*] {desc}...")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out:
        print(out[:2000])
    if err:
        print(f"[stderr] {err[:500]}")
    return out, err

def main():
    print("=" * 60)
    print("  Rebuild Docker Image")
    print("=" * 60)

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS, timeout=30)
    print("[+] Connected!")

    # Build image
    print("\n[1/3] Building Docker image (5-10 minutes)...")
    print("      This includes: npm install, prisma generate, next build")
    
    out, err = run_ssh(ssh, f"cd {DEPLOY_DIR}/app && docker build -t expertos-web:latest . 2>&1", "Building image")
    
    # Check if build succeeded
    if "Successfully built" in out or "Successfully tagged" in out:
        print("\n[SUCCESS] Docker image built successfully!")
    elif "Build failed" in out or "error" in err.lower():
        print("\n[ERROR] Build failed. Checking errors...")
        # Get last 50 lines of build output
        if "Module not found" in out:
            print("Still have module resolution issues. Checking what's missing...")
            run_ssh(ssh, f"ls -la {DEPLOY_DIR}/app/", "Listing app directory")
        return
    
    # Start container
    print("\n[2/3] Starting web container...")
    run_ssh(ssh, "docker stop expertos-web 2>/dev/null; docker rm expertos-web 2>/dev/null || true", "Cleanup")
    run_ssh(ssh, f"cd {DEPLOY_DIR} && docker-compose up -d web", "Starting container")
    
    # Verify
    print("\n[3/3] Verifying...")
    time.sleep(10)
    run_ssh(ssh, f"cd {DEPLOY_DIR} && docker-compose ps", "Container status")
    
    stdin, stdout, stderr = ssh.exec_command("curl -s -m 10 -o /dev/null -w '%{http_code}' http://localhost:3001")
    code = stdout.read().decode('utf-8').strip()
    print(f"\nHTTP Status: {code}")

    if code in ["200", "302", "307"]:
        print("\n" + "=" * 60)
        print("  SUCCESS! ExpertOS is running!")
        print(f"  URL: http://{SERVER_IP}:3001")
        print("=" * 60)
    else:
        print("\n[!] Checking container logs...")
        run_ssh(ssh, "docker logs expertos-web 2>&1 | tail -30", "Logs")

    ssh.close()

if __name__ == "__main__":
    main()
