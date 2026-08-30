@echo off
setlocal enabledelayedexpansion
TITLE PLMSys - Miniserve High-Performance LAN Server
cd /d "%~dp0"

ECHO ============================================================
ECHO     PLMSys - Miniserve Zero-Install LAN / Offline Server
ECHO            (Latest Miniserve v0.35.0 Engine)
ECHO ============================================================
ECHO.

SET "PORT=3000"
SET "BUNDLE_DIR=dist"
SET "RUN_EXE="

:: 1. Check if user is running directly inside an unextracted ZIP
if not exist "dist\" (
    if not exist "package.json" (
        ECHO [ERROR] Project files not found in the current folder!
        ECHO.
        ECHO It looks like you may be running this script directly from
        ECHO inside a compressed ZIP file without extracting it first.
        ECHO.
        ECHO SOLUTION:
        ECHO 1. Close this window.
        ECHO 2. Right-click the downloaded .ZIP file and select "Extract All..."
        ECHO 3. Open the extracted folder and double-click START-MINISERVE.bat again.
        ECHO.
        PAUSE
        EXIT /B 1
    )
)

:: 2. Check if miniserve.exe exists in current dir, tools\, or in PATH
if exist "miniserve.exe" (
    SET "RUN_EXE=miniserve.exe"
) else if exist "tools\miniserve.exe" (
    SET "RUN_EXE=tools\miniserve.exe"
) else (
    where miniserve >nul 2>nul
    if !errorlevel! equ 0 (
        SET "RUN_EXE=miniserve"
    )
)

:: 3. If miniserve is not found, attempt to download automatically
if "%RUN_EXE%"=="" (
    ECHO [INFO] miniserve.exe not found in directory or system PATH.
    ECHO [INFO] Attempting to download Miniserve v0.35.0 (Windows 64-bit)...
    ECHO.

    :: Try curl.exe if available (built into modern Windows 10/11)
    where curl.exe >nul 2>nul
    if !errorlevel! equ 0 (
        curl.exe -L -o miniserve.exe "https://github.com/svenstaro/miniserve/releases/download/v0.35.0/miniserve-v0.35.0-x86_64-pc-windows-msvc.exe"
    )

    :: If curl didn't download it, try PowerShell WebClient
    if not exist "miniserve.exe" (
        powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object System.Net.WebClient).DownloadFile('https://github.com/svenstaro/miniserve/releases/download/v0.35.0/miniserve-v0.35.0-x86_64-pc-windows-msvc.exe', 'miniserve.exe')"
    )

    if exist "miniserve.exe" (
        ECHO [SUCCESS] miniserve.exe downloaded successfully!
        SET "RUN_EXE=miniserve.exe"
    ) else (
        ECHO [WARNING] Automated download could not be completed (e.g. offline PC).
        ECHO.
        ECHO You can download miniserve.exe manually:
        ECHO 1. Open: https://github.com/svenstaro/miniserve/releases/latest
        ECHO 2. Download: miniserve-v0.35.0-x86_64-pc-windows-msvc.exe
        ECHO 3. Rename it to "miniserve.exe" and put it in this folder.
        ECHO.
        PAUSE
        EXIT /B 1
    )
)

:: 4. Check if dist/ folder exists with compiled assets
if not exist "%BUNDLE_DIR%\index.html" (
    ECHO.
    ECHO [INFO] Production bundle folder "%BUNDLE_DIR%" not found.
    where node >nul 2>nul
    if !errorlevel! equ 0 (
        ECHO [INFO] Building production bundle using npm...
        CALL npm run build
        if !errorlevel! neq 0 (
            ECHO [ERROR] Production build failed!
            PAUSE
            EXIT /B 1
        )
    ) else (
        ECHO [ERROR] "%BUNDLE_DIR%\index.html" was not found and Node.js is not installed.
        ECHO Please ensure the pre-built 'dist' folder is present in this directory.
        PAUSE
        EXIT /B 1
    )
)

:: 5. Show Local IP for LAN connections
ECHO.
ECHO ============================================================
ECHO  Starting Miniserve on http://localhost:%PORT%
ECHO  Local Area Network (LAN) Connections Enabled:
ipconfig | findstr /i "IPv4"
ECHO ============================================================
ECHO.
ECHO Other tablets or workstations on this local network can connect to:
ECHO http://^<YOUR-IP^>:%PORT%
ECHO.

:: 6. Launch browser in background
start "" "http://localhost:%PORT%"

:: 7. Run miniserve in SPA mode serving dist directory
ECHO [SERVER ACTIVE] Press Ctrl+C in this window to stop miniserve.
ECHO.
"%RUN_EXE%" --spa --index index.html -p %PORT% -i 0.0.0.0 %BUNDLE_DIR%

if %errorlevel% neq 0 (
    ECHO.
    ECHO [WARNING] Miniserve exited with code %errorlevel%.
)

PAUSE
