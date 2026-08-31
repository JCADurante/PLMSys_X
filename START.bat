@echo off
TITLE PLMSys - Plate Lifecycle Monitoring System
cd /d "%~dp0"

ECHO ============================================================
ECHO         PLMSys - Plate Lifecycle Monitoring System
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
    ECHO 3. Open the extracted folder and double-click START.bat again.
    ECHO.
    PAUSE
    EXIT /B 1
)

:: 2. Check Node.js in PATH
where node >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\Program Files\nodejs\node.exe" set "PATH=C:\Program Files\nodejs;%PATH%"
    if exist "C:\Program Files (x86)\nodejs\node.exe" set "PATH=C:\Program Files (x86)\nodejs;%PATH%"
    if exist "%LOCALAPPDATA%\Programs\node\node.exe" set "PATH=%LOCALAPPDATA%\Programs\node;%PATH%"
)

where node >nul 2>nul
if %errorlevel% neq 0 (
    ECHO ============================================================
    ECHO [ERROR] Node.js is NOT installed on this computer!
    ECHO ============================================================
    ECHO.
    ECHO Node.js is required to run the centralized server.
    ECHO.
    ECHO QUICK FIX:
    ECHO 1. Download and install Node.js (LTS version) from:
    ECHO    https://nodejs.org/
    ECHO 2. During installation, make sure "Add to PATH" is checked.
    ECHO 3. After installing Node.js, double-click START.bat again.
    ECHO.
    PAUSE
    EXIT /B 1
)

ECHO [OK] Node.js is installed!
node -v
ECHO.

:: 3. Check dependencies
if not exist "node_modules\" (
    ECHO [INFO] First-time setup: Installing required packages...
    ECHO Please wait 1-2 minutes...
    ECHO.
    CALL npm install
    if %errorlevel% neq 0 (
        ECHO.
        ECHO [ERROR] Dependency installation failed!
        ECHO Please check your internet connection or run 'npm install' in Command Prompt.
        ECHO.
        PAUSE
        EXIT /B 1
    )
    ECHO.
    ECHO [OK] Packages installed successfully!
    ECHO.
)

:: 4. Show Network IP
ECHO ============================================================
ECHO  Local Area Network (LAN) IP Addresses:
ipconfig | findstr /i "IPv4"
ECHO ============================================================
ECHO.
ECHO Starting PLMSys Central Server on http://localhost:3000 ...
ECHO Other devices on LAN can open: http://<YOUR-IP>:3000
ECHO.

:: 5. Launch browser
start "" "http://localhost:3000"

:: 6. Run Server
CALL npm run dev

if %errorlevel% neq 0 (
    ECHO.
    ECHO [WARNING] Server stopped.
)

PAUSE
