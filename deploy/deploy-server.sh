#!/bin/bash
# ExpertOS Production Deployment Script
# Server: 193.233.233.217
# Mission 16: Production Deployment

set -e

echo "=========================================="
echo "  ExpertOS Production Deployment"
echo "=========================================="

# Configuration
SERVER_IP="193.233.233.217"
SERVER_USER="root"
DEPLOY_DIR="/var/www/expertos"

echo ""
echo "[1/7] Creating deployment directory..."
mkdir -p $DEPLOY_DIR
cd $DEPLOY_DIR

echo ""
echo "[2/7] Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "Docker not found. Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl start docker
    systemctl enable docker
    rm get-docker.sh
    echo "Docker installed successfully!"
else
    echo "Docker already installed: $(docker --version)"
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "Docker Compose installed!"
else
    echo "Docker Compose already installed: $(docker-compose --version)"
fi

echo ""
echo "[3/7] Creating docker-compose.yml..."
cat > docker-compose.yml << 'COMPOSE_EOF'
version: '3.8'

services:
  # PostgreSQL Database
  db:
    image: postgres:16-alpine
    container_name: expertos-db
    restart: always
    environment:
      POSTGRES_USER: expertos
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: expertos
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U expertos"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - expertos-network

  # Next.js Frontend
  web:
    build:
      context: ./app
      dockerfile: Dockerfile
    container_name: expertos-web
    restart: always
    depends_on:
      db:
        condition: service_healthy
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://expertos:${POSTGRES_PASSWORD}@db:5432/expertos
      - NEXTAUTH_URL=http://${SERVER_IP}:3000
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    ports:
      - "3000:3000"
    volumes:
      - ./uploads:/app/uploads
      - ./reports:/app/public/generated_reports
    networks:
      - expertos-network

networks:
  expertos-network:
    driver: bridge

volumes:
  postgres_data:
COMPOSE_EOF

echo ""
echo "[4/7] Creating .env file..."
cat > .env << ENV_EOF
# ExpertOS Production Environment
POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-24)
NEXTAUTH_SECRET=$(openssl rand -base64 32)
SERVER_IP=${SERVER_IP}
ENV_EOF

echo ""
echo "[5/7] Creating necessary directories..."
mkdir -p app uploads reports nginx/ssl

echo ""
echo "[6/7] Pulling Docker images..."
docker-compose pull db || true

echo ""
echo "[7/7] Starting PostgreSQL..."
docker-compose up -d db

echo ""
echo "=========================================="
echo "  SERVER PREPARED SUCCESSFULLY!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Upload the ExpertOS app code to: $DEPLOY_DIR/app/"
echo "2. Run: docker-compose up -d"
echo "3. Access: http://${SERVER_IP}:3000"
echo ""
echo "Database credentials saved to: $DEPLOY_DIR/.env"
echo ""
