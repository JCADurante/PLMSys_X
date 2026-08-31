@echo off
TITLE PLMSys - Production Server
cd /d "%~dp0"

ECHO ============================================================
ECHO     PLMSys - Production Build & Launcher (Offline Mode)
ECHO ============================================================
ECHO.

:: 1. Check if unextracted ZIP
if not exist "package.json" (
    ECHO [ERROR] package.json not found in the current directory!
    ECHO.
    ECHO It looks like you may be running this script directly from
    ECHO inside a compressed ZIP file without extracting it first.
    ECHO.
    ECHO SOLUTION:
    ECHO 1. Close this window.
    ECHO 2. Right-click the downloaded .ZIP file and select "Extract All..."
    ECHO 3. Open the extracted folder and double-click START-PRODUCTION.bat again.
    ECHO.
    PAUSE
    EXIT /B 1
)

:: 2. Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\Program Files\nodejs\node.exe" set "PATH=C:\Program Files\nodejs;%PATH%"
    if exist "C:\Program Files (x86)\nodejs\node.exe" set "PATH=C:\Program Files (x86)\nodejs;%PATH%"
    if exist "%LOCALAPPDATA%\Programs\node\node.exe" set "PATH=%LOCALAPPDATA%\Programs\node;%PATH%"
)

where node >nul 2>nul
if %errorlevel% neq 0 (
    ECHO [ERROR] Node.js is NOT installed or not found in system PATH.
    ECHO Please install Node.js (v18 or higher) from https://nodejs.org/
    ECHO.
    PAUSE
    EXIT /B 1
)

ECHO [OK] Node.js is installed!
node -v
ECHO.

:: 3. Check if node_modules directory exists
if not exist "node_modules\" (
    ECHO [INFO] Installing required dependencies...
    CALL npm install
    if %errorlevel% neq 0 (
        ECHO [ERROR] Dependency installation failed!
        PAUSE
        EXIT /B 1
    )
)

:: 4. Build production bundle if dist doesn't exist
if not exist "dist\index.html" (
    ECHO [INFO] Building production bundle...
    CALL npm run build
    if %errorlevel% neq 0 (
        ECHO [ERROR] Production build failed!
        PAUSE
        EXIT /B 1
    )
)

:: 5. Open browser automatically
ECHO [INFO] Launching http://localhost:3000 in your web browser...
start "" "http://localhost:3000"

:: 6. Run production server
ECHO ============================================================
ECHO  PLMSys Production Server active! Keep this window open.
ECHO  To stop the server, press Ctrl+C in this window.
ECHO ============================================================
ECHO.
CALL npm start

if %errorlevel% neq 0 (
    ECHO.
    ECHO [WARNING] Server stopped with exit code %errorlevel%.
)

PAUSE
