@echo off
TITLE PLMSys - Plate Lifecycle Monitoring System
cd /d "%~dp0"

ECHO ============================================================
ECHO         PLMSys - Plate Lifecycle Monitoring System
ECHO     (Supports Portable Node, Installed Node, & Miniserve)
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

:: 2. Check for Portable Node.js
set "NODE_EXEC="
set "SERVER_MODE="

if exist "%~dp0node.exe" (
    set "PATH=%~dp0;%PATH%"
    set "NODE_EXEC=%~dp0node.exe"
    set "SERVER_MODE=PORTABLE_NODE"
    ECHO [OK] Using portable standalone Node.js from current folder.
) else if exist "%~dp0bin\node.exe" (
    set "PATH=%~dp0bin;%PATH%"
    set "NODE_EXEC=%~dp0bin\node.exe"
    set "SERVER_MODE=PORTABLE_NODE"
    ECHO [OK] Using portable Node.js from bin\ folder.
) else if exist "%~dp0nodejs\node.exe" (
    set "PATH=%~dp0nodejs;%PATH%"
    set "NODE_EXEC=%~dp0nodejs\node.exe"
    set "SERVER_MODE=PORTABLE_NODE"
    ECHO [OK] Using portable Node.js from nodejs\ folder.
) else if exist "%~dp0node\node.exe" (
    set "PATH=%~dp0node;%PATH%"
    set "NODE_EXEC=%~dp0node\node.exe"
    set "SERVER_MODE=PORTABLE_NODE"
    ECHO [OK] Using portable Node.js from node\ folder.
) else if exist "%~dp0tools\node.exe" (
    set "PATH=%~dp0tools;%PATH%"
    set "NODE_EXEC=%~dp0tools\node.exe"
    set "SERVER_MODE=PORTABLE_NODE"
    ECHO [OK] Using portable Node.js from tools\ folder.
) else if exist "%~dp0portable-node\node.exe" (
    set "PATH=%~dp0portable-node;%PATH%"
    set "NODE_EXEC=%~dp0portable-node\node.exe"
    set "SERVER_MODE=PORTABLE_NODE"
    ECHO [OK] Using portable Node.js from portable-node\ folder.
)

:: 3. If Portable Node wasn't found, check for System Installed Node.js
if "%NODE_EXEC%"=="" (
    node -v >nul 2>nul
    if %errorlevel% equ 0 (
        set "NODE_EXEC=node"
        set "SERVER_MODE=INSTALLED_NODE"
        ECHO [OK] Using system installed Node.js.
    ) else (
        if exist "C:\Program Files\nodejs\node.exe" (
            set "PATH=C:\Program Files\nodejs;%PATH%"
            set "NODE_EXEC=C:\Program Files\nodejs\node.exe"
            set "SERVER_MODE=INSTALLED_NODE"
            ECHO [OK] Using Node.js from Program Files.
        ) else if exist "%LOCALAPPDATA%\Programs\node\node.exe" (
            set "PATH=%LOCALAPPDATA%\Programs\node;%PATH%"
            set "NODE_EXEC=%LOCALAPPDATA%\Programs\node\node.exe"
            set "SERVER_MODE=INSTALLED_NODE"
            ECHO [OK] Using Node.js from LocalAppData.
        ) else if exist "%ProgramFiles%\nodejs\node.exe" (
            set "PATH=%ProgramFiles%\nodejs;%PATH%"
            set "NODE_EXEC=%ProgramFiles%\nodejs\node.exe"
            set "SERVER_MODE=INSTALLED_NODE"
            ECHO [OK] Using Node.js from Program Files.
        )
    )
)

:: 4. If Node.js is not present, check for Miniserve
set "MINISERVE_EXEC="
if "%NODE_EXEC%"=="" (
    if exist "%~dp0miniserve.exe" (
        set "MINISERVE_EXEC=%~dp0miniserve.exe"
        set "SERVER_MODE=MINISERVE"
        ECHO [OK] Using portable miniserve.exe from current folder.
    ) else if exist "%~dp0bin\miniserve.exe" (
        set "MINISERVE_EXEC=%~dp0bin\miniserve.exe"
        set "SERVER_MODE=MINISERVE"
        ECHO [OK] Using portable miniserve.exe from bin\ folder.
    ) else if exist "%~dp0tools\miniserve.exe" (
        set "MINISERVE_EXEC=%~dp0tools\miniserve.exe"
        set "SERVER_MODE=MINISERVE"
        ECHO [OK] Using portable miniserve.exe from tools\ folder.
    ) else (
        where miniserve >nul 2>nul
        if %errorlevel% equ 0 (
            set "MINISERVE_EXEC=miniserve"
            set "SERVER_MODE=MINISERVE"
            ECHO [OK] Using system miniserve.
        )
    )
)

:: 5. If nothing found, provide guided setup options
if "%SERVER_MODE%"=="" (
    ECHO ============================================================
    ECHO [NOTICE] No Web Server runtime found on your PC.
    ECHO ============================================================
    ECHO.
    ECHO PLMSys supports three easy running options:
    ECHO.
    ECHO   [1] Standalone Portable Node.js (Download single node.exe - No install needed)
    ECHO   [2] Standalone Miniserve (Download single miniserve.exe - No install needed)
    ECHO   [3] Standard Node.js Installer (from https://nodejs.org)
    ECHO   [4] Exit
    ECHO.
    set /p choice="Choose an option (1, 2, 3, 4): "
    if "%choice%"=="1" (
        ECHO Opening Node.js Windows binary download page...
        start "" "https://nodejs.org/dist/latest/win-x64/node.exe"
        ECHO After downloading node.exe, place it in this folder and double-click START.bat again.
        PAUSE
        EXIT /B 0
    ) else if "%choice%"=="2" (
        ECHO Opening Miniserve releases page...
        start "" "https://github.com/svenstaro/miniserve/releases"
        ECHO Download miniserve-win-x86_64.exe, rename to miniserve.exe, place here, and run START-MINISERVE.bat!
        PAUSE
        EXIT /B 0
    ) else if "%choice%"=="3" (
        ECHO Opening Node.js installer website...
        start "" "https://nodejs.org/"
        PAUSE
        EXIT /B 0
    )
    EXIT /B 1
)

:: 6. Miniserve Launch Execution
if "%SERVER_MODE%"=="MINISERVE" (
    ECHO [OK] Web server mode: Miniserve (Rust Single Binary)
    if not exist "dist\index.html" (
        ECHO [ERROR] dist\index.html is required for Miniserve.
        PAUSE
        EXIT /B 1
    )
    ECHO.
    ECHO ============================================================
    ECHO  Local Area Network (LAN) IP Addresses:
    ipconfig | findstr /i "IPv4"
    ECHO ============================================================
    ECHO.
    ECHO Starting Miniserve on http://localhost:3000 ...
    start "" "http://localhost:3000"
    "%MINISERVE_EXEC%" dist --spa --index index.html --port 3000 --interfaces 0.0.0.0
    if %errorlevel% neq 0 (
        ECHO [WARNING] Miniserve exited with code %errorlevel%.
        PAUSE
    )
    EXIT /B 0
)

:: 7. Node.js Launch Execution (Portable or Installed)
ECHO [OK] Web server mode: Node.js (%SERVER_MODE%)
"%NODE_EXEC%" -v
ECHO.

:: Check dist folder
if not exist "dist\index.html" (
    if not exist "node_modules\" (
        ECHO [INFO] First-time setup: Installing required libraries...
        call npm install
        if %errorlevel% neq 0 (
            ECHO [ERROR] npm install failed.
            PAUSE
            EXIT /B 1
        )
    )
    ECHO [INFO] Building production bundle...
    call npm run build
    if %errorlevel% neq 0 (
        ECHO [ERROR] Build step failed.
        PAUSE
        EXIT /B 1
    )
)

:: Show LAN IP
ECHO ============================================================
ECHO  Local Area Network (LAN) IP Addresses:
ipconfig | findstr /i "IPv4"
ECHO ============================================================
ECHO.
ECHO Starting PLMSys Central Server on http://localhost:3000 ...
ECHO Other tablets and PCs on Wi-Fi can open: http://^<YOUR-IP^>:3000
ECHO.

:: Launch browser
start "" "http://localhost:3000"

:: Run Central Node Server
"%NODE_EXEC%" server.js

if %errorlevel% neq 0 (
    ECHO.
    ECHO [WARNING] Server stopped with error code %errorlevel%.
)

PAUSE
