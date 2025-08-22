@echo off
echo ========================================
echo   Intelagent Platform Database Migration
echo   Vector Storage & Multi-Tenant Setup
echo ========================================
echo.

REM Check if DATABASE_URL is set
if "%DATABASE_URL%"=="" (
    echo ERROR: DATABASE_URL environment variable is not set!
    echo Please set it to your Railway PostgreSQL connection string.
    echo.
    echo Example:
    echo set DATABASE_URL=postgresql://user:password@host:port/database
    echo.
    pause
    exit /b 1
)

echo Using database: %DATABASE_URL:~0,30%...
echo.

REM Run the migration script
echo Running migration...
node scripts\migrate-vector-tables.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Migration failed! Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Generating Prisma Client...
echo ========================================
cd packages\database
call npx prisma generate

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Prisma generate failed!
    pause
    exit /b 1
)

cd ..\..

echo.
echo ========================================
echo Migration Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Add these to Railway environment variables:
echo    - PINECONE_API_KEY=your_key_here
echo    - PINECONE_ENVIRONMENT=us-east-1
echo    - PINECONE_INDEX_NAME=chatbot
echo.
echo 2. Restart your Railway services
echo.
echo 3. Test the chatbot indexing with:
echo    PUT /api/chatbot/[siteKey] with action: 'index'
echo.
pause