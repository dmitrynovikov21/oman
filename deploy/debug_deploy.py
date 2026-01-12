#!/usr/bin/env python3
"""Debug deployment - check logs and firewall"""

import subprocess
import sys
import os

# Force UTF-8 output
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

def run_ssh(ssh, cmd, desc=""):
    print(f"[*] {desc}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=60)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    # Remove problematic characters
    out = out.replace('\u2714', '[OK]').replace('\u2705', '[OK]')
    if out:
        print(out[:3000])
    if err:
        print(f"[stderr] {err[:500]}")
    return out

def main():
    print("=" * 60)
    print("  DEBUG: ExpertOS Deployment")
    print("=" * 60)

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS, timeout=30)
    print("[+] Connected!")

    # Container status
    print("\n[1] Container Status:")
    run_ssh(ssh, f"cd {DEPLOY_DIR} && docker-compose ps", "docker ps")
    
    # Web container detailed logs
    print("\n[2] Web Container Logs (last 100 lines):")
    run_ssh(ssh, "docker logs expertos-web 2>&1 | tail -100 | tr -d '\\x00-\\x1F' | head -80", "web logs")
    
    # Check if port 3001 is listening
    print("\n[3] Port 3001 Status:")
    run_ssh(ssh, "ss -tlnp | grep 3001 || echo 'Port 3001 NOT listening'", "port check")
    
    # Check firewall
    print("\n[4] Firewall Status:")
    run_ssh(ssh, "ufw status 2>/dev/null || iptables -L INPUT -n | head -10 || echo 'No firewall info'", "firewall")
    
    # Open port 3001 if needed
    print("\n[5] Opening port 3001 in firewall:")
    run_ssh(ssh, "ufw allow 3001 2>/dev/null || iptables -A INPUT -p tcp --dport 3001 -j ACCEPT 2>/dev/null || echo 'Firewall command skipped'", "open port")
    
    # Test local connection
    print("\n[6] Testing local connection:")
    run_ssh(ssh, "curl -s -o /dev/null -w 'HTTP %{http_code}' http://localhost:3001 2>/dev/null || echo 'Local connection failed'", "curl test")

    print("\n" + "=" * 60)
    ssh.close()

if __name__ == "__main__":
    main()
