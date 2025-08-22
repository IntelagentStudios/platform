@echo off
cls
echo.
echo  ██╗███╗   ██╗████████╗███████╗██╗      █████╗  ██████╗ ███████╗███╗   ██╗████████╗
echo  ██║████╗  ██║╚══██╔══╝██╔════╝██║     ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝
echo  ██║██╔██╗ ██║   ██║   █████╗  ██║     ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║
echo  ██║██║╚██╗██║   ██║   ██╔══╝  ██║     ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║
echo  ██║██║ ╚████║   ██║   ███████╗███████╗██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║
echo  ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝
echo.
echo                         QUICK SETUP - MULTI-TENANT PLATFORM
echo ================================================================================
echo.

REM Check for Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo This will set up your Intelagent Platform with:
echo  - Multi-tenant database architecture
echo  - GBP billing system (£449/£649/£449)
echo  - Redis caching (Railway)
echo  - Security policies and GDPR compliance
echo  - Test license: INTL-AGNT-BOSS-MODE
echo.
echo Press any key to start or Ctrl+C to cancel...
pause >nul

echo.
echo [STEP 1/5] Installing Dependencies
echo ================================================================================
call npm install --silent
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [STEP 2/5] Setting up Environment Variables
echo ================================================================================
node scripts/setup-env.js
if %errorlevel% neq 0 (
    echo ERROR: Failed to setup environment
    pause
    exit /b 1
)

echo.
echo [STEP 3/5] Building Packages
echo ================================================================================
echo Building database package...
cd packages\database
call npm run build >nul 2>&1
cd ..\..

echo Building billing package...
cd packages\billing
call npm run build >nul 2>&1
cd ..\..

echo Building compliance package...
cd packages\compliance
call npm run build >nul 2>&1
cd ..\..

echo Building redis package...
cd packages\redis
call npm run build >nul 2>&1
cd ..\..

echo.
echo [STEP 4/5] Initializing Database
echo ================================================================================
node scripts/init-database.js
if %errorlevel% neq 0 (
    echo ERROR: Failed to initialize database
    echo.
    echo Please ensure PostgreSQL is running and accessible
    pause
    exit /b 1
)

echo.
echo [STEP 5/5] Verifying Setup
echo ================================================================================
node scripts/verify-setup.js

echo.
echo ================================================================================
echo                              SETUP COMPLETE!
echo ================================================================================
echo.
echo 📋 IMPORTANT NEXT STEPS:
echo.
echo 1. Update Stripe API keys in CREDENTIALS.md:
echo    - Open CREDENTIALS.md
echo    - Go to https://dashboard.stripe.com
echo    - Copy your test API keys
echo    - Update the .env.local files
echo.
echo 2. Configure Stripe Webhook:
echo    - Go to Stripe Dashboard > Webhooks
echo    - Add endpoint: http://localhost:3000/api/webhooks/stripe
echo    - Select events: checkout.session.completed, customer.subscription.*
echo.
echo 3. Start the development servers:
echo    npm run dev
echo.
echo 4. Access the portals:
echo    - Customer Portal: http://localhost:3000
echo    - Admin Portal: http://localhost:3001
echo    - Use license: INTL-AGNT-BOSS-MODE
echo.
echo ================================================================================
pause