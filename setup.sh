#!/bin/bash

echo "========================================"
echo "Intelagent Platform - Automated Setup"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "[1/10] Installing root dependencies..."
npm install --silent

echo "[2/10] Installing package dependencies..."
npm install stripe@14.0.0 jose@5.2.0 jsonwebtoken@9.0.0 @types/jsonwebtoken@9.0.0 @types/express@4.17.17 --save --silent

echo "[3/10] Building database package..."
cd packages/database
npm run build 2>/dev/null
cd ../..

echo "[4/10] Building billing package..."
cd packages/billing
npm run build 2>/dev/null
cd ../..

echo "[5/10] Building compliance package..."
cd packages/compliance
npm run build 2>/dev/null
cd ../..

echo "[6/10] Building Redis package..."
cd packages/redis
npm run build 2>/dev/null
cd ../..

echo "[7/10] Setting up environment variables..."
node scripts/setup-env.js

echo "[8/10] Initializing database..."
node scripts/init-database.js

echo "[9/10] Cleaning up Git issues..."
git rm -f nul 2>/dev/null
git rm -f apps/admin-portal/nul 2>/dev/null

echo "[10/10] Verifying setup..."
node scripts/verify-setup.js

echo ""
echo "========================================"
echo "Setup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Review .env files in each app directory"
echo "2. Configure Stripe webhook URL in Stripe Dashboard"
echo "3. Run 'npm run dev' to start development"
echo ""