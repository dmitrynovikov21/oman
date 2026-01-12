#!/usr/bin/env python3
"""Use subprocess with sshpass/plink instead of paramiko"""
import subprocess
import sys
import os

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

SERVER = "193.233.233.217"
USER = "root"
PASS = "3WP64PLwbT2Y"

# Try with Windows OpenSSH
print("[1] Testing SSH connectivity...")

# Method 1: Use echo + ssh with sshpass simulation via expect-like
# Since we're on Windows, let's use a simple approach

# Create a temp script with commands
commands = """
docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -E '(expertos|ocr)'
curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/
docker exec expertos-db psql -U expertos -t -c "SELECT LENGTH(extracted_text) FROM documents WHERE name = 'test_arabic.pdf' ORDER BY created_at DESC LIMIT 1;" 2>/dev/null
"""

# Try using the plink tool if available
try:
    # Check if plink exists
    result = subprocess.run(["where", "plink"], capture_output=True, text=True)
    if result.returncode == 0:
        print("  Using plink...")
        cmd = ["plink", "-ssh", "-batch", "-pw", PASS, f"{USER}@{SERVER}", "docker ps | head -5"]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        print(result.stdout)
        print(result.stderr)
    else:
        print("  plink not found")
except Exception as e:
    print(f"  plink error: {e}")

# Try with ssh command line
try:
    print("\n[2] Trying Windows SSH...")
    # Use sshpass if available, or just test the ssh command
    cmd = f'ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30 {USER}@{SERVER} "echo SSH_OK && docker ps --format \'{{{{.Names}}}}\\t{{{{.Status}}}}\' | head -5"'
    print(f"  Command: {cmd[:60]}...")
    
    # This will prompt for password, but let's see if ssh is working
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=60)
    print(f"  stdout: {result.stdout}")
    print(f"  stderr: {result.stderr[:200]}")
except Exception as e:
    print(f"  SSH error: {e}")

print("\n[3] Summary:")
print("  If SSH requires password prompt, you can run manually:")
print(f'  ssh {USER}@{SERVER} "cd /var/www/expertos/app && docker build -t expertos-web:latest . && docker restart expertos-web"')
