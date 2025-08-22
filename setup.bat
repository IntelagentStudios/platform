@echo off
echo ========================================
echo Intelagent Platform - Automated Setup
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed. Please install Node.js first.
    exit /b 1
)

echo [1/10] Installing root dependencies...
call npm install --silent

echo [2/10] Installing package dependencies...
call npm install stripe@14.0.0 jose@5.2.0 jsonwebtoken@9.0.0 @types/jsonwebtoken@9.0.0 @types/express@4.17.17 --save --silent

echo [3/10] Building database package...
cd packages\database
call npm run build >nul 2>&1
cd ..\..

echo [4/10] Building billing package...
cd packages\billing
call npm run build >nul 2>&1
cd ..\..

echo [5/10] Building compliance package...
cd packages\compliance
call npm run build >nul 2>&1
cd ..\..

echo [6/10] Building Redis package...
cd packages\redis
call npm run build >nul 2>&1
cd ..\..

echo [7/10] Setting up environment variables...
node scripts\setup-env.js

echo [8/10] Initializing database...
node scripts\init-database.js

echo [9/10] Cleaning up Git issues...
git rm -f nul >nul 2>&1
git rm -f apps\admin-portal\nul >nul 2>&1

echo [10/10] Verifying setup...
node scripts\verify-setup.js

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Review .env files in each app directory
echo 2. Configure Stripe webhook URL in Stripe Dashboard
echo 3. Run 'npm run dev' to start development
echo.
pause