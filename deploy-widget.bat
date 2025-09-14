@echo off
echo ========================================
echo  Intelagent Widget Deployment to Vercel
echo ========================================
echo.

cd public\widget

echo Checking if Vercel CLI is installed...
where vercel >nul 2>&1
if %errorlevel% neq 0 (
    echo Vercel CLI not found. Installing...
    npm install -g vercel
    if %errorlevel% neq 0 (
        echo Failed to install Vercel CLI. Please install manually: npm i -g vercel
        pause
        exit /b 1
    )
)

echo.
echo Deploying to Vercel...
echo.

REM Deploy to production
vercel --prod --yes

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo  Deployment Successful!
    echo ========================================
    echo.
    echo Your widget is now live at:
    echo https://intelagent-widget.vercel.app/v1/chatbot.js
    echo.
    echo Customers can embed it with:
    echo ^<script src="https://intelagent-widget.vercel.app/v1/chatbot.js" data-product-key="KEY"^>^</script^>
    echo.
    echo To set up a custom domain:
    echo 1. Go to https://vercel.com/dashboard
    echo 2. Select your project
    echo 3. Go to Settings -^> Domains
    echo 4. Add cdn.intelagentstudios.com
    echo.
) else (
    echo.
    echo Deployment failed. Please check the error messages above.
    echo.
)

cd ..\..
pause