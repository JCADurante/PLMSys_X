@echo off
TITLE PLMSys - Miniserve High-Performance LAN Server
ECHO ============================================================
ECHO     PLMSys - Miniserve Zero-Install LAN / Offline Server
ECHO            (Latest Miniserve v0.35.0 Engine)
ECHO ============================================================
ECHO.

SET MINISERVE_EXE=miniserve.exe
SET PORT=3000
SET BUNDLE_DIR=dist

:: 1. Check if miniserve.exe exists in current dir, tools\, or in PATH
if exist "%MINISERVE_EXE%" (
    SET RUN_EXE=%MINISERVE_EXE%
) else if exist "tools\%MINISERVE_EXE%" (
    SET RUN_EXE=tools\%MINISERVE_EXE%
) else (
    where miniserve >nul 2>nul
    if %errorlevel% equ 0 (
        SET RUN_EXE=miniserve
    ) else (
        ECHO [INFO] miniserve.exe not found in directory or system PATH.
        ECHO [INFO] Attempting to download the latest miniserve v0.35.0 for Windows (64-bit)...
        ECHO.
        powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Write-Host 'Downloading miniserve v0.35.0 from GitHub...'; Invoke-WebRequest -Uri 'https://github.com/svenstaro/miniserve/releases/download/v0.35.0/miniserve-v0.35.0-x86_64-pc-windows-msvc.exe' -OutFile 'miniserve.exe'"
        
        if exist "%MINISERVE_EXE%" (
            ECHO [SUCCESS] miniserve.exe downloaded successfully!
            SET RUN_EXE=%MINISERVE_EXE%
        ) else (
            ECHO [WARNING] Automated download failed or network is offline.
            ECHO Please manually download miniserve.exe from:
            ECHO https://github.com/svenstaro/miniserve/releases/latest
            ECHO and place miniserve.exe in this folder.
            ECHO.
            PAUSE
            EXIT /B 1
        )
    )
)

:: 2. Check if dist/ folder exists with production assets
if not exist "%BUNDLE_DIR%\index.html" (
    ECHO.
    ECHO [INFO] Production bundle "%BUNDLE_DIR%" not found.
    ECHO [INFO] Building production bundle using npm...
    CALL npm run build
    if %errorlevel% neq 0 (
        ECHO [ERROR] Production build failed!
        PAUSE
        EXIT /B 1
    )
)

:: 3. Show Local IP for LAN connections
ECHO.
ECHO ============================================================
ECHO  Starting Miniserve on http://localhost:%PORT%
ECHO  Local Area Network (LAN) Access Enabled:
ipconfig | findstr /i "IPv4"
ECHO ============================================================
ECHO.
ECHO Other tablets or computers on this network can open:
ECHO http://^<YOUR-IP^>:%PORT%
ECHO.

:: 4. Launch browser after 1 second
start "" "http://localhost:%PORT%"

:: 5. Run miniserve in SPA mode serving dist directory
ECHO [SERVER ACTIVE] Press Ctrl+C in this window to stop miniserve.
ECHO.
"%RUN_EXE%" --spa --index index.html --port %PORT% --interfaces 0.0.0.0 %BUNDLE_DIR%

PAUSE
