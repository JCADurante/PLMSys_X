@echo off
TITLE PLMSys - Portable Node.js Launcher
cd /d "%~dp0"

ECHO ============================================================
ECHO       PLMSys - Portable Node.js Central Server
ECHO ============================================================
ECHO.

:: 1. Check if unextracted ZIP
if not exist "package.json" (
    ECHO [ERROR] package.json not found in current folder!
    ECHO Please extract all files from the ZIP before running.
    ECHO.
    PAUSE
    EXIT /B 1
)

:: 2. Check for Portable node.exe in various locations
set "NODE_EXEC="

if exist "%~dp0node.exe" (
    set "NODE_EXEC=%~dp0node.exe"
    set "PATH=%~dp0;%PATH%"
    ECHO [OK] Using portable node.exe in project root folder.
) else if exist "%~dp0bin\node.exe" (
    set "NODE_EXEC=%~dp0bin\node.exe"
    set "PATH=%~dp0bin;%PATH%"
    ECHO [OK] Using portable node.exe in bin\ directory.
) else if exist "%~dp0tools\node.exe" (
    set "NODE_EXEC=%~dp0tools\node.exe"
    set "PATH=%~dp0tools;%PATH%"
    ECHO [OK] Using portable node.exe in tools\ directory.
) else if exist "%~dp0nodejs\node.exe" (
    set "NODE_EXEC=%~dp0nodejs\node.exe"
    set "PATH=%~dp0nodejs;%PATH%"
    ECHO [OK] Using portable node.exe in nodejs\ directory.
) else if exist "%~dp0node\node.exe" (
    set "NODE_EXEC=%~dp0node\node.exe"
    set "PATH=%~dp0node;%PATH%"
    ECHO [OK] Using portable node.exe in node\ directory.
) else if exist "%~dp0portable-node\node.exe" (
    set "NODE_EXEC=%~dp0portable-node\node.exe"
    set "PATH=%~dp0portable-node;%PATH%"
    ECHO [OK] Using portable node.exe in portable-node\ directory.
)

if "%NODE_EXEC%"=="" (
    ECHO ============================================================
    ECHO [NOTICE] Portable node.exe was not found in this folder!
    ECHO ============================================================
    ECHO.
    ECHO How to use Portable Node.js (Zero Installation):
    ECHO   1. Download `node.exe` (Win x64 binary) from:
    ECHO      https://nodejs.org/dist/latest/win-x64/node.exe
    ECHO   2. Place `node.exe` directly inside this project folder.
    ECHO   3. Re-run this START-PORTABLE-NODE.bat script!
    ECHO.
    ECHO Alternatively, if you have installed Node.js or miniserve.exe,
    ECHO you can use START.bat or START-MINISERVE.bat.
    ECHO.
    set /p dlopt="Open Node.js binary download in browser? (Y/N): "
    if /i "%dlopt%"=="Y" (
        start "" "https://nodejs.org/dist/latest/win-x64/node.exe"
    )
    PAUSE
    EXIT /B 1
)

ECHO [OK] Portable Node.js is ready:
"%NODE_EXEC%" -v
ECHO.

:: 3. Show LAN IP addresses
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

:: 5. Run zero-dependency Node server
"%NODE_EXEC%" server.js

if %errorlevel% neq 0 (
    ECHO.
    ECHO [WARNING] Server stopped with error code %errorlevel%.
)

PAUSE
