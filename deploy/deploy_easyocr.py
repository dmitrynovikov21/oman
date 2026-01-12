#!/usr/bin/env python3
"""Deploy EasyOCR service to production"""
import subprocess, sys, os, time, json
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
try:
    import paramiko
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko

SERVER = ("193.233.233.217", "root", "3WP64PLwbT2Y")
LOCAL = r"c:\gravity\gravity\expertos"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(SERVER[0], username=SERVER[1], password=SERVER[2], timeout=30)
sftp = ssh.open_sftp()
print("[+] Connected!")

# 1. Upload EasyOCR service files
print("\n[1/5] Uploading EasyOCR service...")
ssh.exec_command("mkdir -p /var/www/expertos/ocr_service")
sftp.put(os.path.join(LOCAL, "backend", "ocr_service.py"), "/var/www/expertos/ocr_service/ocr_service.py")
sftp.put(os.path.join(LOCAL, "backend", "Dockerfile.ocr"), "/var/www/expertos/ocr_service/Dockerfile")
print("  [OK]")

# 2. Build EasyOCR Docker image
print("\n[2/5] Building EasyOCR Docker image (this may take 5-10 minutes)...")
start = time.time()
stdin, stdout, stderr = ssh.exec_command(
    "cd /var/www/expertos/ocr_service && docker build -t easyocr-service:latest . 2>&1 | tail -20",
    timeout=900
)
output = stdout.read().decode('utf-8', errors='replace')
elapsed = int(time.time() - start)
print(f"  Build: {elapsed}s")

if "successfully" in output.lower():
    print("  [OK] Image built!")
else:
    print("  Building...")
    print(output[-500:])

# 3. Start EasyOCR container
print("\n[3/5] Starting EasyOCR container...")
ssh.exec_command("docker stop easyocr-service; docker rm easyocr-service 2>/dev/null")
time.sleep(2)

stdin, stdout, stderr = ssh.exec_command('''docker run -d \
    --name easyocr-service \
    --restart always \
    --network expertos_default \
    -p 5000:5000 \
    -v expertos_uploads_data:/uploads:ro \
    easyocr-service:latest 2>&1''')
container_id = stdout.read().decode().strip()
print(f"  Container: {container_id[:20]}")

print("  Waiting 60s for model to load...")
time.sleep(60)

# 4. Check EasyOCR health
print("\n[4/5] Checking EasyOCR service...")
stdin, stdout, stderr = ssh.exec_command("curl -s http://localhost:5000/health")
health = stdout.read().decode()
print(f"  Health: {health}")

# 5. Test OCR
print("\n[5/5] Testing EasyOCR on document...")

# Convert PDF to image first
ssh.exec_command("docker exec expertos-web pdftoppm -png -r 300 -f 1 -l 1 /app/public/uploads/ocr_test_case/test_arabic.pdf /tmp/test")
time.sleep(3)
ssh.exec_command("docker cp expertos-web:/tmp/test-1.png /tmp/test_img.png")

# Call EasyOCR service
stdin, stdout, stderr = ssh.exec_command('''curl -s -X POST http://localhost:5000/ocr -H "Content-Type: application/json" -d '{"image_path":"/tmp/test_img.png"}' ''', timeout=120)
result = stdout.read().decode('utf-8', errors='replace')

try:
    data = json.loads(result)
    if data.get('success'):
        print(f"\n  ✅ EasyOCR SUCCESS!")
        print(f"  Characters: {data.get('character_count')}")
        print(f"  Confidence: {data.get('average_confidence', 0)*100:.1f}%")
        print(f"\n  First 800 chars:\n{data.get('text', '')[:800]}")
    else:
        print(f"  ❌ Error: {data.get('error')}")
except:
    print(f"  Response: {result[:400]}")

# Show logs
print("\n  EasyOCR logs:")
stdin, stdout, stderr = ssh.exec_command("docker logs easyocr-service 2>&1 | tail -10")
print(stdout.read().decode('utf-8', errors='replace'))

sftp.close()
ssh.close()
