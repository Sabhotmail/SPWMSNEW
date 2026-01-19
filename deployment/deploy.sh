#!/bin/bash

# SPWMS Deployment Script
# This script automates the deployment process on the production server

set -e  # Exit on error

echo "🚀 Starting SPWMS deployment..."

# Configuration
APP_DIR="/var/www/spwms"
APP_NAME="spwms"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as correct user
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}Error: Do not run this script as root${NC}"
   exit 1
fi

# Navigate to app directory
cd $APP_DIR

echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm ci --production=false

echo -e "${YELLOW}🔄 Generating Prisma client...${NC}"
npx prisma generate

echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
npx prisma migrate deploy

echo -e "${YELLOW}🏗️  Building application...${NC}"
npm run build

echo -e "${YELLOW}🔄 Restarting PM2 process...${NC}"
pm2 restart $APP_NAME

echo -e "${YELLOW}💾 Saving PM2 configuration...${NC}"
pm2 save

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"

echo -e "${YELLOW}📊 Application status:${NC}"
pm2 status $APP_NAME

echo -e "\n${YELLOW}📝 View logs:${NC}"
echo "  pm2 logs $APP_NAME"

echo -e "\n${YELLOW}🌐 Application should be running at:${NC}"
echo "  http://localhost:3000"
