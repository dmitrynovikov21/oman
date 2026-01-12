#!/usr/bin/env python3
"""Check what's happening inside the web container"""

import subprocess
import sys
import os

os.environ["PYTHONIOENCODING"] = "utf-8"

try:
    import paramiko
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko

SERVER_IP = "193.233.233.217"
SERVER_USER = "root"
SERVER_PASS = "3WP64PLwbT2Y"

def run_ssh(ssh, cmd, desc=""):
    print(f"\n[*] {desc}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=120)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    # Clean output
    for char in ['\u2714', '\u2705', '\u25cf', '\u2588', '\u2593']:
        out = out.replace(char, '[X]')
    if out:
        print(out[:4000])
    if err:
        print(f"[stderr] {err[:500]}")
    return out

def main():
    print("=" * 60)
    print("  Check Web Container Internals")
    print("=" * 60)

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS, timeout=30)
    print("[+] Connected!")

    # Check what process is running
    run_ssh(ssh, "docker exec expertos-web ps aux 2>/dev/null || echo 'Container may be restarting'", "Processes in container")
    
    # Check if node is running
    run_ssh(ssh, "docker exec expertos-web pgrep -a node 2>/dev/null || echo 'No node process found'", "Node processes")
    
    # Get last 50 lines of the actual log
    run_ssh(ssh, "docker logs expertos-web 2>&1 | grep -E '(error|Error|ERROR|build|Building|ready|started|listening)' | tail -30", "Filtered logs")
    
    # Check for build errors
    run_ssh(ssh, "docker logs expertos-web 2>&1 | grep -i 'error' | tail -20", "Error lines")
    
    # Current status
    run_ssh(ssh, "docker inspect expertos-web --format '{{.State.Status}} - Started: {{.State.StartedAt}}' 2>/dev/null", "Container state")

    print("\n" + "=" * 60)
    ssh.close()

if __name__ == "__main__":
    main()
