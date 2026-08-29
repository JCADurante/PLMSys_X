@echo off
TITLE PLMSys - Production Server
ECHO ============================================================
ECHO     PLMSys - Production Build & Launcher (Offline Mode)
ECHO ============================================================
ECHO.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    ECHO [ERROR] Node.js is not installed or not in your PATH.
    ECHO Please install Node.js (v18 or higher) from https://nodejs.org/
    ECHO.
    PAUSE
    EXIT /B 1
)

:: Check if node_modules directory exists
if not exist "node_modules\" (
    ECHO [INFO] Installing required dependencies...
    CALL npm install
    if %errorlevel% neq 0 (
        ECHO [ERROR] Dependency installation failed!
        PAUSE
        EXIT /B 1
    )
)

:: Build production bundle
ECHO [INFO] Building production bundle...
CALL npm run build
if %errorlevel% neq 0 (
    ECHO [ERROR] Production build failed!
    PAUSE
    EXIT /B 1
)

:: Open browser automatically
ECHO.
ECHO [INFO] Launching http://localhost:3000 in your web browser...
start "" http://localhost:3000

:: Run production server
ECHO ============================================================
ECHO  PLMSys Production Server active! Keep this window open.
ECHO ============================================================
ECHO.
CALL npm start

PAUSE
