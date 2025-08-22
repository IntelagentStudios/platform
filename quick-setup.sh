#!/bin/bash

clear
echo ""
echo "  ██╗███╗   ██╗████████╗███████╗██╗      █████╗  ██████╗ ███████╗███╗   ██╗████████╗"
echo "  ██║████╗  ██║╚══██╔══╝██╔════╝██║     ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝"
echo "  ██║██╔██╗ ██║   ██║   █████╗  ██║     ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║"
echo "  ██║██║╚██╗██║   ██║   ██╔══╝  ██║     ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║"
echo "  ██║██║ ╚████║   ██║   ███████╗███████╗██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║"
echo "  ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝"
echo ""
echo "                         QUICK SETUP - MULTI-TENANT PLATFORM"
echo "================================================================================"
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi

echo "This will set up your Intelagent Platform with:"
echo " - Multi-tenant database architecture"
echo " - GBP billing system (£449/£649/£449)"
echo " - Redis caching (Railway)"
echo " - Security policies and GDPR compliance"
echo " - Test license: INTL-AGNT-BOSS-MODE"
echo ""
echo "Press Enter to start or Ctrl+C to cancel..."
read

echo ""
echo "[STEP 1/5] Installing Dependencies"
echo "================================================================================"
npm install --silent
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi

echo ""
echo "[STEP 2/5] Setting up Environment Variables"
echo "================================================================================"
node scripts/setup-env.js
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to setup environment"
    exit 1
fi

echo ""
echo "[STEP 3/5] Building Packages"
echo "================================================================================"
echo "Building database package..."
cd packages/database
npm run build 2>/dev/null
cd ../..

echo "Building billing package..."
cd packages/billing
npm run build 2>/dev/null
cd ../..

echo "Building compliance package..."
cd packages/compliance
npm run build 2>/dev/null
cd ../..

echo "Building redis package..."
cd packages/redis
npm run build 2>/dev/null
cd ../..

echo ""
echo "[STEP 4/5] Initializing Database"
echo "================================================================================"
node scripts/init-database.js
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to initialize database"
    echo ""
    echo "Please ensure PostgreSQL is running and accessible"
    exit 1
fi

echo ""
echo "[STEP 5/5] Verifying Setup"
echo "================================================================================"
node scripts/verify-setup.js

echo ""
echo "================================================================================"
echo "                              SETUP COMPLETE!"
echo "================================================================================"
echo ""
echo "📋 IMPORTANT NEXT STEPS:"
echo ""
echo "1. Update Stripe API keys in CREDENTIALS.md:"
echo "   - Open CREDENTIALS.md"
echo "   - Go to https://dashboard.stripe.com"
echo "   - Copy your test API keys"
echo "   - Update the .env.local files"
echo ""
echo "2. Configure Stripe Webhook:"
echo "   - Go to Stripe Dashboard > Webhooks"
echo "   - Add endpoint: http://localhost:3000/api/webhooks/stripe"
echo "   - Select events: checkout.session.completed, customer.subscription.*"
echo ""
echo "3. Start the development servers:"
echo "   npm run dev"
echo ""
echo "4. Access the portals:"
echo "   - Customer Portal: http://localhost:3000"
echo "   - Admin Portal: http://localhost:3001"
echo "   - Use license: INTL-AGNT-BOSS-MODE"
echo ""
echo "================================================================================"