#!/bin/bash
# Build verification script - Run before pushing to catch errors early

echo "🔍 Railway Build Verification Script"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall success
BUILD_SUCCESS=true

echo "1️⃣ Building skills-orchestrator package..."
cd packages/skills-orchestrator
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ skills-orchestrator build failed!${NC}"
    BUILD_SUCCESS=false
else
    echo -e "${GREEN}✅ skills-orchestrator build passed${NC}"
fi
cd ../..

echo ""
echo "2️⃣ Building customer-portal app (main Railway target)..."
cd apps/customer-portal
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ customer-portal build failed!${NC}"
    BUILD_SUCCESS=false
else
    echo -e "${GREEN}✅ customer-portal build passed${NC}"
fi
cd ../..

echo ""
echo "3️⃣ Building admin-portal app..."
cd apps/admin-portal
npm run build
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️ admin-portal build failed (not critical for Railway)${NC}"
else
    echo -e "${GREEN}✅ admin-portal build passed${NC}"
fi
cd ../..

echo ""
echo "===================================="
if [ "$BUILD_SUCCESS" = true ]; then
    echo -e "${GREEN}✅ All critical builds passed! Safe to push to Railway.${NC}"
    exit 0
else
    echo -e "${RED}❌ Build verification failed! Fix errors before pushing.${NC}"
    echo ""
    echo "Tips to fix common issues:"
    echo "  • Stripe API version should be '2023-10-16'"
    echo "  • Use SkillCategory.AUTOMATION instead of SYSTEM"
    echo "  • Database tables: chatbot_config (not chatbot_configurations)"
    echo "  • Use skill_audit_log (not skill_logs)"
    exit 1
fi