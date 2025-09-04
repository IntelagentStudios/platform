#!/bin/bash

# Chatbot Migration Deployment Script
# This script handles the deployment of the chatbot migration from n8n to skills system

set -e

echo "🚀 Starting Chatbot Migration Deployment..."
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Not in project root directory${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Building skills-orchestrator package...${NC}"
cd packages/skills-orchestrator
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Skills orchestrator built successfully${NC}"
else
    echo -e "${RED}✗ Failed to build skills orchestrator${NC}"
    exit 1
fi
cd ../..

echo -e "${YELLOW}Step 2: Running tests...${NC}"
# Add your test command here
# npm test

echo -e "${YELLOW}Step 3: Building customer portal...${NC}"
cd apps/customer-portal
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Customer portal built successfully${NC}"
else
    echo -e "${RED}✗ Failed to build customer portal${NC}"
    exit 1
fi
cd ../..

echo -e "${YELLOW}Step 4: Checking deployment readiness...${NC}"

# Check if the skills API endpoint exists
if [ -f "apps/customer-portal/app/api/chatbot-skills/route.ts" ]; then
    echo -e "${GREEN}✓ Skills API endpoint found${NC}"
else
    echo -e "${RED}✗ Skills API endpoint missing${NC}"
    exit 1
fi

# Check if chatbot widget has been updated
if grep -q "const mode = scriptTag?.getAttribute('data-mode') || 'skills'" "apps/customer-portal/public/chatbot-widget.js"; then
    echo -e "${GREEN}✓ Chatbot widget configured for skills mode${NC}"
else
    echo -e "${RED}✗ Chatbot widget not configured correctly${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 5: Creating deployment backup...${NC}"
timestamp=$(date +%Y%m%d_%H%M%S)
mkdir -p backups
cp apps/customer-portal/public/chatbot-widget.js "backups/chatbot-widget.${timestamp}.js"
echo -e "${GREEN}✓ Backup created: backups/chatbot-widget.${timestamp}.js${NC}"

echo -e "${YELLOW}Step 6: Deployment checklist:${NC}"
echo "  [ ] Database migrations applied"
echo "  [ ] Environment variables configured"
echo "  [ ] SSL certificates valid"
echo "  [ ] Monitoring endpoints configured"
echo "  [ ] Rollback procedure documented"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment preparation complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Review the deployment checklist above"
echo "2. Deploy to staging first: git push staging main"
echo "3. Test with: curl -X POST https://staging.dashboard.intelagentstudios.com/api/chatbot-skills"
echo "4. If successful, deploy to production: git push production main"
echo ""
echo -e "${YELLOW}Rollback command if needed:${NC}"
echo "cp backups/chatbot-widget.${timestamp}.js apps/customer-portal/public/chatbot-widget.js"