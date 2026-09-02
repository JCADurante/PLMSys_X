@echo off
TITLE PLMSys - Miniserve Launcher
cd /d "%~dp0"

ECHO ============================================================
ECHO       PLMSys - Ultra-Fast Miniserve Static Server
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

:: 2. Search for Miniserve binary
set "MINISERVE_EXEC="

if exist "%~dp0miniserve.exe" (
    set "MINISERVE_EXEC=%~dp0miniserve.exe"
    ECHO [OK] Found portable miniserve.exe in root directory.
) else if exist "%~dp0bin\miniserve.exe" (
    set "MINISERVE_EXEC=%~dp0bin\miniserve.exe"
    ECHO [OK] Found portable miniserve.exe in bin\ directory.
) else if exist "%~dp0tools\miniserve.exe" (
    set "MINISERVE_EXEC=%~dp0tools\miniserve.exe"
    ECHO [OK] Found portable miniserve.exe in tools\ directory.
) else if exist "%~dp0miniserve\miniserve.exe" (
    set "MINISERVE_EXEC=%~dp0miniserve\miniserve.exe"
    ECHO [OK] Found portable miniserve.exe in miniserve\ directory.
) else (
    where miniserve >nul 2>nul
    if %errorlevel% equ 0 (
        set "MINISERVE_EXEC=miniserve"
        ECHO [OK] Found miniserve in system PATH.
    )
)

if "%MINISERVE_EXEC%"=="" (
    ECHO ============================================================
    ECHO [NOTICE] miniserve.exe was not found in this folder.
    ECHO ============================================================
    ECHO.
    ECHO Miniserve is a single-file executable web server (no installation).
    ECHO.
    ECHO How to get miniserve:
    ECHO   1. Download `miniserve-win-x86_64.exe` from:
    ECHO      https://github.com/svenstaro/miniserve/releases
    ECHO   2. Rename it to `miniserve.exe` and place it in this folder.
    ECHO.
    ECHO Alternatively, if you have Node.js or portable node.exe,
    ECHO you can use START.bat instead.
    ECHO.
    set /p dlopt="Open miniserve download page in browser? (Y/N): "
    if /i "%dlopt%"=="Y" (
        start "" "https://github.com/svenstaro/miniserve/releases"
    )
    PAUSE
    EXIT /B 1
)

:: 3. Check for pre-compiled dist folder
if not exist "dist\index.html" (
    ECHO [WARN] dist\index.html was not found!
    ECHO Miniserve serves pre-compiled frontend assets from the dist folder.
    ECHO.
    where node >nul 2>nul
    if %errorlevel% equ 0 (
        ECHO [INFO] Node.js detected. Building dist folder now...
        if not exist "node_modules\" call npm install
        call npm run build
    ) else if exist "%~dp0node.exe" (
        ECHO [INFO] Portable Node detected. Building dist folder now...
        "%~dp0node.exe" server.js & exit /b 0
    ) else (
        ECHO [ERROR] Cannot build dist because Node.js is not present.
        ECHO Please ensure the pre-built 'dist' folder is included in the project.
        PAUSE
        EXIT /B 1
    )
)

:: 4. Show LAN IPv4 addresses
ECHO.
ECHO ============================================================
ECHO  Local Area Network (LAN) IP Addresses:
ipconfig | findstr /i "IPv4"
ECHO ============================================================
ECHO.
ECHO Starting Miniserve SPA Server on port 3000...
ECHO Local Access:   http://localhost:3000
ECHO Factory Access: http://^<YOUR-IP^>:3000
ECHO.

:: 5. Launch browser
start "" "http://localhost:3000"

:: 6. Run Miniserve with SPA fallback
"%MINISERVE_EXEC%" dist --spa --index index.html --port 3000 --interfaces 0.0.0.0

if %errorlevel% neq 0 (
    ECHO.
    ECHO [WARNING] Miniserve exited with code %errorlevel%.
)

PAUSE
