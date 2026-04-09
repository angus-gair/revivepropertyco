#!/bin/bash

# Revive Property Co. Deployment Script
# ========================================

set -e

echo "🚀 Revive Property Co. Deployment Script"
echo "========================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ========================================
# Pre-flight checks
# ========================================
echo -e "\n${YELLOW}Running pre-flight checks...${NC}"

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ ERROR: .env.production not found${NC}"
    echo -e "${YELLOW}Copy .env.production.example to .env.production and fill in values${NC}"
    exit 1
fi

# Source environment variables
source .env.production

# Check for required variables
check_env_var() {
    if [ -z "${!1}" ]; then
        echo -e "${RED}❌ ERROR: $2 is not set${NC}"
        MISSING_VARS=true
    fi
}

check_env_var RESEND_API_KEY "Resend API key"
check_env_var JWT_SECRET "JWT secret"

if [ "$MISSING_VARS" = true ]; then
    echo -e "${RED}❌ Missing required environment variables${NC}"
    echo -e "${YELLOW}Please update .env.production with the required values${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Pre-flight checks passed${NC}"

# ========================================
# Build phase
# ========================================
echo -e "\n${YELLOW}Building Docker image...${NC}"

docker compose -f docker-compose.production.yml build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"

# ========================================
# Stop existing container
# ========================================
echo -e "\n${YELLOW}Stopping existing container...${NC}"

docker compose -f docker-compose.production.yml down 2>/dev/null || true

# ========================================
# Deploy phase
# ========================================
echo -e "\n${YELLOW}Starting deployment...${NC}"

docker compose -f docker-compose.production.yml up -d

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Deployment successful${NC}"

# ========================================
# Post-deployment checks
# ========================================
echo -e "\n${YELLOW}Running post-deployment checks...${NC}"

# Wait for container to start
echo "Waiting for services to start..."
sleep 10

# Check backend health
echo -n "Checking backend health..."
HEALTH_CHECKS=0
MAX_CHECKS=12

while [ $HEALTH_CHECKS -lt $MAX_CHECKS ]; do
    if docker exec revivepropertyco wget -qO- http://localhost:8080/health > /dev/null; then
        echo -e "${GREEN}✅ Backend health check passed${NC}"
        break
    fi
    sleep 5
    HEALTH_CHECKS=$((HEALTH_CHECKS + 1))
done

if [ $HEALTH_CHECKS -eq $MAX_CHECKS ]; then
    echo -e "${RED}❌ Backend health check failed after 60 seconds${NC}"
    echo -e "${YELLOW}Check logs with: docker compose -f docker-compose.production.yml logs${NC}"
fi

# ========================================
# Summary
# ========================================
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\n${YELLOW}Application is now running:${NC}"
echo -e "  Frontend: https://revivepropertyco.au"
echo -e "  Backend API: https://revivepropertyco.au/api/*"
echo -e "  Health Check: https://revivepropertyco.au/health"
echo -e "\n${YELLOW}Useful commands:${NC}"
echo -e "  View logs:     docker compose -f docker-compose.production.yml logs -f"
echo -e "  Stop service:  docker compose -f docker-compose.production.yml down"
echo -e "  Restart:       docker compose -f docker-compose.production.yml restart"
echo ""
