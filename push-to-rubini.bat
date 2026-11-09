@echo off
title Push Smart Ambulance Routing to Rubiniponnar GitHub
color 0B
echo ======================================================================
echo   SMART AMBULANCE ROUTING - PUSH TO GITHUB (Rubiniponnar)
echo ======================================================================
echo.

cd /d "%~dp0"

echo 1. Checking git remote...
git remote remove origin >nul 2>&1
git remote add origin https://github.com/Rubiniponnar/smart-ambulance-routing.git
git branch -M main

echo 2. Staging all files...
git add .
git commit -m "feat: complete Smart Ambulance Routing web app for Render deployment" >nul 2>&1

echo.
echo 3. Pushing to https://github.com/Rubiniponnar/smart-ambulance-routing ...
echo    (If GitHub login window pops up, click Authorize/Sign In)
echo.
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ======================================================================
    echo   SUCCESSFULLY PUSHED TO GITHUB!
    echo   Repository: https://github.com/Rubiniponnar/smart-ambulance-routing
    echo ======================================================================
    echo.
    echo Opening Render.com to generate your live link...
    start https://dashboard.render.com/static/new
) else (
    echo.
    echo [NOTE] If the repository does not exist yet on GitHub:
    echo 1. Open: https://github.com/new?name=smart-ambulance-routing
    echo 2. Click 'Create repository'
    echo 3. Re-run this script!
    echo.
    start https://github.com/new?name=smart-ambulance-routing
)

pause
