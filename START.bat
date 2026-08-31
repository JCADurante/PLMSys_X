@echo off
TITLE PLMSys - Plate Lifecycle Monitoring System
cd /d "%~dp0"

ECHO ============================================================
ECHO         PLMSys - Plate Lifecycle Monitoring System
ECHO           (Centralized Multi-Device Server)
ECHO ============================================================
ECHO.

:: 1. Check if unextracted ZIP
if not exist "server.js" (
    ECHO [ERROR] server.js not found in current folder!
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

:: 3. Show Network IP
ECHO ============================================================
ECHO  Local Area Network (LAN) IP Addresses:
ipconfig | findstr /i "IPv4"
ECHO ============================================================
ECHO.
ECHO Starting PLMSys Central Server on http://localhost:3000 ...
ECHO Other tablets and PCs on Wi-Fi can open: http://^<YOUR-IP^>:3000
ECHO.

:: 4. Launch browser
start "" "http://localhost:3000"

:: 5. Run Central Node Server (Zero dependencies required!)
node server.js

if %errorlevel% neq 0 (
    ECHO.
    ECHO [WARNING] Server stopped with error code %errorlevel%.
)

PAUSE
