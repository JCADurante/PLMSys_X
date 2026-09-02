@echo off
TITLE PLMSys - Automated Setup & Launcher
cd /d "%~dp0"

ECHO ============================================================
ECHO         PLMSys - Automated Setup & Launcher
ECHO     (Supports Portable Node, Installed Node, & Miniserve)
ECHO ============================================================
ECHO.

:: 1. Check for Portable / Standalone Node.js or System Node.js
set "NODE_EXEC="
if exist "%~dp0node.exe" (
    set "PATH=%~dp0;%PATH%"
    set "NODE_EXEC=%~dp0node.exe"
    ECHO [OK] Using portable standalone Node.js from current folder.
) else if exist "%~dp0bin\node.exe" (
    set "PATH=%~dp0bin;%PATH%"
    set "NODE_EXEC=%~dp0bin\node.exe"
    ECHO [OK] Using portable Node.js from bin\ folder.
) else if exist "%~dp0tools\node.exe" (
    set "PATH=%~dp0tools;%PATH%"
    set "NODE_EXEC=%~dp0tools\node.exe"
    ECHO [OK] Using portable Node.js from tools\ folder.
) else if exist "%~dp0nodejs\node.exe" (
    set "PATH=%~dp0nodejs;%PATH%"
    set "NODE_EXEC=%~dp0nodejs\node.exe"
    ECHO [OK] Using portable Node.js from nodejs\ folder.
) else if exist "%~dp0node\node.exe" (
    set "PATH=%~dp0node;%PATH%"
    set "NODE_EXEC=%~dp0node\node.exe"
    ECHO [OK] Using portable Node.js from node\ folder.
) else (
    node -v >nul 2>nul
    if %errorlevel% equ 0 (
        set "NODE_EXEC=node"
        ECHO [OK] Using system installed Node.js.
    ) else (
        if exist "C:\Program Files\nodejs\node.exe" set "PATH=C:\Program Files\nodejs;%PATH%" & set "NODE_EXEC=C:\Program Files\nodejs\node.exe"
        if exist "%LOCALAPPDATA%\Programs\node\node.exe" set "PATH=%LOCALAPPDATA%\Programs\node;%PATH%" & set "NODE_EXEC=%LOCALAPPDATA%\Programs\node\node.exe"
        if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%" & set "NODE_EXEC=%ProgramFiles%\nodejs\node.exe"
    )
)

:: Miniserve fallback
if "%NODE_EXEC%"=="" (
    if exist "%~dp0miniserve.exe" (
        ECHO [OK] Node.js not found, launching with Miniserve!
        CALL "%~dp0START-MINISERVE.bat"
        EXIT /B 0
    ) else (
        where miniserve >nul 2>nul
        if %errorlevel% equ 0 (
            ECHO [OK] Node.js not found, launching with system Miniserve!
            CALL "%~dp0START-MINISERVE.bat"
            EXIT /B 0
        )
    )

    ECHO [ERROR] Node.js is not found on this computer.
    ECHO You can either:
    ECHO 1. Download standalone node.exe (or miniserve.exe) and place it in this folder, OR
    ECHO 2. Download and install Node.js from https://nodejs.org/
    ECHO.
    PAUSE
    EXIT /B 1
)

ECHO [OK] Node.js is ready:
"%NODE_EXEC%" -v
ECHO.

:: 2. Install NPM packages if missing or requested
if not exist "node_modules\" (
    if exist "dist\index.html" (
        ECHO [OK] dist\ directory already built. Ready to serve!
    ) else (
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
    )
) else (
    ECHO [OK] node_modules folder is already present.
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
"%NODE_EXEC%" server.js

PAUSE
