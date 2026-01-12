@echo off
REM ExpertOS Deploy Helper for Windows
REM This script uploads files to the production server

set SERVER_IP=193.233.233.217
set SERVER_USER=root
set SERVER_PASS=3WP64PLwbT2Y
set DEPLOY_DIR=/var/www/expertos

echo ==========================================
echo   ExpertOS Production Deployment
echo   Server: %SERVER_IP%
echo ==========================================
echo.

echo [Step 1] This script will help you deploy to the server.
echo.
echo You need to:
echo 1. Open a terminal (PowerShell or CMD)
echo 2. Run the SSH commands below manually
echo.

echo ==========================================
echo   SSH COMMANDS TO RUN:
echo ==========================================
echo.
echo [1] Connect to server:
echo     ssh root@%SERVER_IP%
echo     (Password: %SERVER_PASS%)
echo.
echo [2] Once connected, run:
echo     mkdir -p /var/www/expertos
echo     cd /var/www/expertos
echo.
echo [3] Install Docker (if not installed):
echo     curl -fsSL https://get.docker.com ^| sh
echo     systemctl start docker
echo     systemctl enable docker
echo.
echo [4] Check Docker:
echo     docker --version
echo.
echo ==========================================
echo.
pause
