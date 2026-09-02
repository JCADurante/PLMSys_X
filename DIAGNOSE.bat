@echo off
setlocal enabledelayedexpansion
TITLE PLMSys - Troubleshooting & Environment Diagnostics
cd /d "%~dp0"

cls
ECHO ============================================================
ECHO       PLMSys - Troubleshooting & Environment Diagnostics
ECHO   (Checking Portable Node, Installed Node, and Miniserve)
ECHO ============================================================
ECHO.
ECHO Current Folder: %CD%
ECHO Windows Version:
ver
ECHO.

ECHO ------------------------------------------------------------
ECHO 1. Checking Project Extraction Status:
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
    ECHO [OK] dist\index.html found (pre-compiled frontend ready for Node / Miniserve).
) else (
    ECHO [WARN] dist\index.html not found yet.
)

ECHO.
ECHO ------------------------------------------------------------
ECHO 2. Checking Runtimes & Web Servers:
ECHO ------------------------------------------------------------

:: Portable Node Check
set "HAS_PORTABLE_NODE=0"
if exist "%~dp0node.exe" (
    ECHO [OK] Portable node.exe detected in current directory!
    set "HAS_PORTABLE_NODE=1"
) else if exist "%~dp0bin\node.exe" (
    ECHO [OK] Portable node.exe detected in bin\ directory!
    set "HAS_PORTABLE_NODE=1"
) else if exist "%~dp0tools\node.exe" (
    ECHO [OK] Portable node.exe detected in tools\ directory!
    set "HAS_PORTABLE_NODE=1"
) else if exist "%~dp0nodejs\node.exe" (
    ECHO [OK] Portable node.exe detected in nodejs\ directory!
    set "HAS_PORTABLE_NODE=1"
) else (
    ECHO [INFO] Portable node.exe not found in local folders.
)

:: Installed Node Check
set "HAS_SYSTEM_NODE=0"
where node >nul 2>nul
if %errorlevel% equ 0 (
    set "HAS_SYSTEM_NODE=1"
    for /f "tokens=*" %%i in ('node -v') do ECHO [OK] System Installed Node.js: %%i
    for /f "tokens=*" %%i in ('npm -v 2^>nul') do ECHO [OK] System NPM is available: %%i
) else (
    ECHO [INFO] System Node.js not found in standard PATH.
)

:: Miniserve Check
set "HAS_MINISERVE=0"
if exist "%~dp0miniserve.exe" (
    ECHO [OK] Portable miniserve.exe detected in current directory!
    set "HAS_MINISERVE=1"
) else if exist "%~dp0bin\miniserve.exe" (
    ECHO [OK] Portable miniserve.exe detected in bin\ directory!
    set "HAS_MINISERVE=1"
) else if exist "%~dp0tools\miniserve.exe" (
    ECHO [OK] Portable miniserve.exe detected in tools\ directory!
    set "HAS_MINISERVE=1"
) else (
    where miniserve >nul 2>nul
    if %errorlevel% equ 0 (
        ECHO [OK] System Miniserve detected in PATH!
        set "HAS_MINISERVE=1"
    ) else (
        ECHO [INFO] Miniserve binary not found.
    )
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
ECHO Choose an action:
ECHO   [1] Start via Universal Auto-Detect (START.bat)
ECHO   [2] Start via Miniserve Server (START-MINISERVE.bat)
ECHO   [3] Start via Portable Node.js (START-PORTABLE-NODE.bat)
ECHO   [4] Add Port 3000 Inbound Rule in Windows Firewall
ECHO   [5] Exit
ECHO ============================================================
set /p opt="Enter choice (1, 2, 3, 4, 5): "

if "%opt%"=="1" (
    CALL "%~dp0START.bat"
) else if "%opt%"=="2" (
    CALL "%~dp0START-MINISERVE.bat"
) else if "%opt%"=="3" (
    CALL "%~dp0START-PORTABLE-NODE.bat"
) else if "%opt%"=="4" (
    ECHO Adding Windows Firewall Rule for Port 3000...
    powershell -Command "Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile -Command New-NetFirewallRule -DisplayName \"PLMSys Server Port 3000\" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow; Write-Host \"[OK] Firewall rule created! Press Enter to exit.\"; Read-Host'"
)

PAUSE
