@echo off
echo ==========================================
echo Building Mubble for Windows
echo ==========================================
echo.

echo [1/4] Installing dependencies...
call pnpm install
if errorlevel 1 (
    echo Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/4] Building packages...
call pnpm run build
if errorlevel 1 (
    echo Failed to build packages
    pause
    exit /b 1
)

echo.
echo [3/4] Building Windows installer...
cd apps/desktop
call pnpm run dist:win
if errorlevel 1 (
    echo Failed to build installer
    pause
    exit /b 1
)
cd ..\..

echo.
echo [4/4] Copying installer to Download folder...
node scripts/copy-installer.js
if errorlevel 1 (
    echo Failed to copy installer
    pause
    exit /b 1
)

echo.
echo ==========================================
echo Build completed successfully!
echo ==========================================
echo.
echo The installer is now available in:
echo   Download Here\
echo.
pause
