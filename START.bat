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

:: 2. Check for Portable / Standalone Node.js or System Node.js
if exist "%~dp0node.exe" (
    set "PATH=%~dp0;%PATH%"
    set "NODE_EXEC=%~dp0node.exe"
    ECHO [OK] Using portable standalone Node.js from current folder.
) else if exist "%~dp0bin\node.exe" (
    set "PATH=%~dp0bin;%PATH%"
    set "NODE_EXEC=%~dp0bin\node.exe"
    ECHO [OK] Using portable Node.js from bin folder.
) else if exist "%~dp0nodejs\node.exe" (
    set "PATH=%~dp0nodejs;%PATH%"
    set "NODE_EXEC=%~dp0nodejs\node.exe"
    ECHO [OK] Using portable Node.js from nodejs folder.
) else if exist "%~dp0node\node.exe" (
    set "PATH=%~dp0node;%PATH%"
    set "NODE_EXEC=%~dp0node\node.exe"
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
    ECHO ============================================================
    ECHO [ERROR] Node.js is not found on your PC!
    ECHO ============================================================
    ECHO.
    ECHO You have two easy options to run PLMSys:
    ECHO.
    ECHO OPTION 1: Standalone / Portable Node.js (NO INSTALLATION REQUIRED):
    ECHO   Download the Windows Binary .zip from https://nodejs.org/dist/latest/
    ECHO   (or node.exe directly) and place node.exe in this folder.
    ECHO.
    ECHO OPTION 2: Standard Installer:
    ECHO   Download and install Node.js from: https://nodejs.org/
    ECHO.
    PAUSE
    EXIT /B 1
)

ECHO [OK] Node.js is ready:
node -v
ECHO.

:: 3. Check if dist folder exists or if npm is needed
if exist "dist\index.html" (
    ECHO [OK] Pre-compiled frontend (dist) found. Zero dependencies needed!
) else (
    if not exist "node_modules\" (
        ECHO [INFO] First-time setup: Installing required libraries...
        call npm install
        if %errorlevel% neq 0 (
            ECHO [ERROR] npm install failed.
            PAUSE
            EXIT /B 1
        )
    )
    ECHO [INFO] Building the production website files (dist folder)...
    call npm run build
    if %errorlevel% neq 0 (
        ECHO [ERROR] Build step failed.
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
