@echo off
TITLE PLMSys - Easy Setup (Install & Run)
cd /d "%~dp0"

ECHO ============================================================
ECHO         PLMSys - Automated Setup & Launcher
ECHO ============================================================
ECHO.

:: 1. Check for Portable / Standalone Node.js or System Node.js
if exist "%~dp0node.exe" (
    set "PATH=%~dp0;%PATH%"
    ECHO [OK] Using portable standalone Node.js from current folder.
) else if exist "%~dp0bin\node.exe" (
    set "PATH=%~dp0bin;%PATH%"
    ECHO [OK] Using portable Node.js from bin folder.
) else if exist "%~dp0nodejs\node.exe" (
    set "PATH=%~dp0nodejs;%PATH%"
    ECHO [OK] Using portable Node.js from nodejs folder.
) else if exist "%~dp0node\node.exe" (
    set "PATH=%~dp0node;%PATH%"
    ECHO [OK] Using portable Node.js from node folder.
) else (
    node -v >nul 2>nul
    if %errorlevel% neq 0 (
        if exist "C:\Program Files\nodejs\node.exe" set "PATH=C:\Program Files\nodejs;%PATH%"
        if exist "%LOCALAPPDATA%\Programs\node\node.exe" set "PATH=%LOCALAPPDATA%\Programs\node;%PATH%"
        if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"
    )
)

node -v >nul 2>nul
if %errorlevel% neq 0 (
    ECHO [ERROR] Node.js is not found on this computer.
    ECHO You can either:
    ECHO 1. Download standalone node.exe and place it in this folder, OR
    ECHO 2. Download and install Node.js from https://nodejs.org/
    ECHO.
    PAUSE
    EXIT /B 1
)

ECHO [OK] Node.js is ready:
node -v
ECHO.

:: 2. Install NPM packages if missing or requested
if not exist "node_modules\" (
    ECHO ------------------------------------------------------------
    ECHO Installing dependencies via NPM (npm install)...
    ECHO This may take 1-2 minutes on first run. Please wait...
    ECHO ------------------------------------------------------------
    call npm install
    if %errorlevel% neq 0 (
        ECHO [ERROR] npm install encountered an error.
        PAUSE
        EXIT /B 1
    )
    ECHO [OK] Dependencies installed successfully!
    ECHO.
) else (
    ECHO [OK] node_modules folder is already installed.
    ECHO.
)

:: 3. Build dist frontend if missing
if not exist "dist\index.html" (
    ECHO ------------------------------------------------------------
    ECHO Building frontend bundle (npm run build)...
    ECHO ------------------------------------------------------------
    call npm run build
    if %errorlevel% neq 0 (
        ECHO [ERROR] npm run build failed.
        PAUSE
        EXIT /B 1
    )
    ECHO [OK] Build completed!
    ECHO.
)

:: 4. Show Local IP Addresses
ECHO ============================================================
ECHO  Local Area Network (LAN) IP Addresses for Mobile/Tablet:
ipconfig | findstr /i "IPv4"
ECHO ============================================================
ECHO.
ECHO Starting PLMSys Central Server on http://localhost:3000 ...
ECHO Other tablets and PCs can connect to: http://^<YOUR-IP^>:3000
ECHO.

:: 5. Launch web browser
start "" "http://localhost:3000"

:: 6. Run Central Node Server
node server.js

PAUSE
