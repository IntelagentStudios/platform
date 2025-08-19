@echo off
echo Cleaning up unnecessary files in Intelagent Platform...
echo.

echo Removing .next build folders (558MB total)...
rmdir /s /q apps\admin-portal\.next 2>nul
rmdir /s /q apps\customer-portal\.next 2>nul

echo Removing turbo cache...
rmdir /s /q .turbo 2>nul
for /d /r . %%d in (.turbo) do @if exist "%%d" rmdir /s /q "%%d" 2>nul

echo Removing log files...
del /s /q *.log 2>nul

echo Removing .cache folders...
for /d /r . %%d in (.cache) do @if exist "%%d" rmdir /s /q "%%d" 2>nul

echo Removing duplicate folders...
rmdir /s /q Dashboard 2>nul
rmdir /s /q "Intelagent Sales Agent" 2>nul

echo.
echo Cleanup complete! Freed up approximately 600MB+
echo Note: Run 'npm run build' to rebuild the applications when needed.
pause