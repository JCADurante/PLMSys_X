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

if exist "server.js" (
    ECHO [OK] server.js found (Central Node server engine ready).
) else (
    ECHO [WARN] server.js not found in current folder.
)

if exist "dist\index.html" (
    ECHO [OK] dist\index.html found (production frontend assets ready).
) else (
    ECHO [WARN] dist\index.html not found yet. (START.bat will build it).
)

ECHO.
ECHO ------------------------------------------------------------
ECHO 2. Checking Node.js & NPM:
ECHO ------------------------------------------------------------
if exist "%~dp0node.exe" (
    ECHO [OK] Standalone portable node.exe detected in current directory!
    set "PATH=%~dp0;%PATH%"
) else if exist "%~dp0bin\node.exe" (
    ECHO [OK] Standalone portable node.exe detected in bin\ directory!
    set "PATH=%~dp0bin;%PATH%"
)
where node >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node -v') do ECHO [OK] Node.js is ready: %%i
    for /f "tokens=*" %%i in ('npm -v 2^>nul') do ECHO [OK] NPM is available: %%i
) else (
    ECHO [FAIL] Node.js is not found in PATH or local directory!
    ECHO [FIX] Either drop a portable node.exe in this folder, or install Node.js from: https://nodejs.org/
)

ECHO.
ECHO ------------------------------------------------------------
ECHO 3. Network & Local IP:
ECHO ------------------------------------------------------------
ipconfig | findstr /i "IPv4"

ECHO.
ECHO ------------------------------------------------------------
ECHO 4. Windows Firewall & Network Category:
ECHO ------------------------------------------------------------
powershell -Command "Get-NetConnectionProfile | Select-Object InterfaceAlias, NetworkCategory" 2>nul

ECHO.
ECHO ============================================================
ECHO Choose an option:
ECHO   [1] Start PLMSys Central Server (START.bat)
ECHO   [2] Allow Port 3000 in Windows Firewall (PowerShell)
ECHO   [3] Exit
ECHO ============================================================
set /p opt="Enter choice (1, 2, 3): "

if "%opt%"=="1" (
    CALL "%~dp0START.bat"
) else if "%opt%"=="2" (
    ECHO Adding Windows Firewall Rule for Port 3000...
    powershell -Command "Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile -Command New-NetFirewallRule -DisplayName \"PLMSys Server Port 3000\" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow; Write-Host \"[OK] Firewall rule created! Press Enter to exit.\"; Read-Host'"
)

PAUSE
