@echo off
TITLE PLMSys - Plate Lifecycle Monitoring System
cd /d "%~dp0"

ECHO ============================================================
ECHO         PLMSys - Plate Lifecycle Monitoring System
ECHO           (Centralized Multi-Device Server)
ECHO ============================================================
ECHO.

:: 1. Check if unextracted ZIP
if not exist "package.json" (
    ECHO [ERROR] package.json not found in current folder!
    ECHO Please make sure you have extracted all files from the ZIP.
    ECHO.
    PAUSE
    EXIT /B 1
)

:: 2. Check Node in PATH
node -v >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\Program Files\nodejs\node.exe" set "PATH=C:\Program Files\nodejs;%PATH%"
    if exist "%LOCALAPPDATA%\Programs\node\node.exe" set "PATH=%LOCALAPPDATA%\Programs\node;%PATH%"
    if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"
)

node -v >nul 2>nul
if %errorlevel% neq 0 (
    ECHO ============================================================
    ECHO [ERROR] Node.js is not found in your system PATH!
    ECHO ============================================================
    ECHO.
    ECHO Node.js is required to run the centralized server.
    ECHO.
    ECHO QUICK FIX:
    ECHO 1. Download and install Node.js (LTS version) from:
    ECHO    https://nodejs.org/
    ECHO 2. During installation, ensure "Add to PATH" is checked.
    ECHO 3. After installing, double-click START.bat again.
    ECHO.
    PAUSE
    EXIT /B 1
)

ECHO [OK] Node.js is ready:
node -v
ECHO.

:: 3. Check if node_modules exists (install if missing)
if not exist "node_modules\" (
    ECHO [INFO] First-time setup: Installing required libraries...
    ECHO This may take 1-2 minutes. Please wait...
    ECHO.
    call npm install
    if %errorlevel% neq 0 (
        ECHO.
        ECHO [ERROR] Failed to install packages via npm.
        ECHO Please ensure your computer is connected to the internet.
        ECHO.
        PAUSE
        EXIT /B 1
    )
    ECHO [OK] Packages installed!
    ECHO.
)

:: 4. Check if dist folder exists (build if missing)
if not exist "dist\index.html" (
    ECHO [INFO] Building the production website files (dist folder)...
    ECHO Please wait a few seconds...
    ECHO.
    call npm run build
    if %errorlevel% neq 0 (
        ECHO.
        ECHO [ERROR] Build step failed.
        ECHO.
        PAUSE
        EXIT /B 1
    )
    ECHO [OK] Production dist folder built successfully!
    ECHO.
)

:: 5. Show Network IP
ECHO ============================================================
ECHO  Local Area Network (LAN) IP Addresses:
ipconfig | findstr /i "IPv4"
ECHO ============================================================
ECHO.
ECHO Starting PLMSys Central Server on http://localhost:3000 ...
ECHO Other tablets and PCs on Wi-Fi can open: http://^<YOUR-IP^>:3000
ECHO.

:: 6. Launch browser
start "" "http://localhost:3000"

:: 7. Run Central Node Server
node server.js

if %errorlevel% neq 0 (
    ECHO.
    ECHO [WARNING] Server stopped with error code %errorlevel%.
)

PAUSE
