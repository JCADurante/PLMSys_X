@echo off
TITLE PLMSys - Production Server Launcher
cd /d "%~dp0"

ECHO ============================================================
ECHO     PLMSys - Production Build & Launcher (Offline Mode)
ECHO ============================================================
ECHO.

:: 1. Check if unextracted ZIP
if not exist "package.json" (
    ECHO [ERROR] package.json not found in the current directory!
    ECHO Please extract all files from the ZIP before running.
    ECHO.
    PAUSE
    EXIT /B 1
)

:: 2. Check for Portable / Standalone Node.js or System Node.js
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
        ECHO [OK] Using installed system Node.js.
    ) else (
        if exist "C:\Program Files\nodejs\node.exe" set "PATH=C:\Program Files\nodejs;%PATH%" & set "NODE_EXEC=C:\Program Files\nodejs\node.exe"
        if exist "%LOCALAPPDATA%\Programs\node\node.exe" set "PATH=%LOCALAPPDATA%\Programs\node;%PATH%" & set "NODE_EXEC=%LOCALAPPDATA%\Programs\node\node.exe"
        if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%" & set "NODE_EXEC=%ProgramFiles%\nodejs\node.exe"
    )
)

:: If Node is missing, check if miniserve is available
if "%NODE_EXEC%"=="" (
    if exist "%~dp0miniserve.exe" (
        ECHO [OK] Node.js not found, but portable miniserve.exe is present!
        CALL "%~dp0START-MINISERVE.bat"
        EXIT /B 0
    ) else if exist "%~dp0bin\miniserve.exe" (
        ECHO [OK] Node.js not found, but portable miniserve.exe in bin\ is present!
        CALL "%~dp0START-MINISERVE.bat"
        EXIT /B 0
    ) else (
        where miniserve >nul 2>nul
        if %errorlevel% equ 0 (
            ECHO [OK] System miniserve detected!
            CALL "%~dp0START-MINISERVE.bat"
            EXIT /B 0
        )
    )

    ECHO [ERROR] Neither Node.js nor Miniserve was found on this computer.
    ECHO You can drop node.exe or miniserve.exe into this folder, or install Node.js from https://nodejs.org/
    ECHO.
    PAUSE
    EXIT /B 1
)

ECHO [OK] Node.js is ready:
"%NODE_EXEC%" -v
ECHO.

:: 3. Check if node_modules directory exists
if not exist "node_modules\" (
    if exist "dist\index.html" (
        ECHO [OK] Pre-compiled dist bundle found. Running zero-dependency server...
    ) else (
        ECHO [INFO] Installing dependencies via npm...
        CALL npm install
        if %errorlevel% neq 0 (
            ECHO [ERROR] Dependency installation failed!
            PAUSE
            EXIT /B 1
        )
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
"%NODE_EXEC%" server.js

if %errorlevel% neq 0 (
    ECHO.
    ECHO [WARNING] Server stopped with exit code %errorlevel%.
)

PAUSE
