@echo off
setlocal enabledelayedexpansion
TITLE PLMSys - System Diagnostics & Launcher

:: Ensure we are in the folder where the bat file is located
cd /d "%~dp0"

cls
ECHO ============================================================
ECHO       PLMSys - Troubleshooting & Environment Diagnostics
ECHO ============================================================
ECHO.
ECHO Current Folder: %CD%
ECHO Windows Version:
ver
ECHO.

ECHO ------------------------------------------------------------
ECHO 1. Checking If Project Files Are Extracted:
ECHO ------------------------------------------------------------
if exist "package.json" (
    ECHO [OK] package.json found.
) else (
    ECHO [FAIL] package.json NOT found!
    ECHO [REASON] You are likely running this from inside an unextracted ZIP.
    ECHO [FIX] Right-click the ZIP file -> "Extract All..." -> Open extracted folder.
)

if exist "dist\index.html" (
    ECHO [OK] dist\index.html found (production assets ready).
) else (
    ECHO [WARN] dist\index.html not found yet.
)

ECHO.
ECHO ------------------------------------------------------------
ECHO 2. Checking Node.js & NPM:
ECHO ------------------------------------------------------------
where node >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node -v') do ECHO [OK] Node.js is installed: %%i
    for /f "tokens=*" %%i in ('npm -v') do ECHO [OK] NPM is installed: %%i
) else (
    ECHO [NOTICE] Node.js is not found in PATH.
    ECHO (Note: Miniserve does NOT require Node.js).
)

ECHO.
ECHO ------------------------------------------------------------
ECHO 3. Checking Miniserve Binary:
ECHO ------------------------------------------------------------
if exist "miniserve.exe" (
    ECHO [OK] miniserve.exe found in current folder.
) else if exist "miniserve*.exe" (
    for %%f in (miniserve*.exe) do ECHO [OK] Found Miniserve binary: %%f
) else (
    where miniserve >nul 2>nul
    if !errorlevel! equ 0 (
        ECHO [OK] miniserve found in system PATH.
    ) else (
        ECHO [NOTICE] miniserve.exe not found in this folder.
        ECHO START-MINISERVE.bat will attempt to download it automatically.
    )
)

ECHO.
ECHO ------------------------------------------------------------
ECHO 4. Network & Local IP:
ECHO ------------------------------------------------------------
ipconfig | findstr /i "IPv4"

ECHO.
ECHO ============================================================
ECHO Choose an option:
ECHO   [1] Start with Miniserve (No Node.js needed - Recommended)
ECHO   [2] Start with Node.js Dev Server (Requires Node.js)
ECHO   [3] Start with Node.js Production Server (Requires Node.js)
ECHO   [4] Download miniserve.exe now
ECHO   [5] Exit
ECHO ============================================================
set /p opt="Enter choice (1, 2, 3, 4, 5): "

if "%opt%"=="1" (
    CALL "%~dp0START-MINISERVE.bat"
) else if "%opt%"=="2" (
    CALL "%~dp0START.bat"
) else if "%opt%"=="3" (
    CALL "%~dp0START-PRODUCTION.bat"
) else if "%opt%"=="4" (
    ECHO Downloading miniserve.exe...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object System.Net.WebClient).DownloadFile('https://github.com/svenstaro/miniserve/releases/download/v0.35.0/miniserve-v0.35.0-x86_64-pc-windows-msvc.exe', 'miniserve.exe')"
    if exist "miniserve.exe" (
        ECHO [SUCCESS] miniserve.exe downloaded successfully!
    ) else (
        ECHO [FAIL] Could not download. Please download manually from https://github.com/svenstaro/miniserve/releases/latest
    )
    PAUSE
)

PAUSE
