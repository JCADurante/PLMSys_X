@echo off
TITLE PLMSys - Plate Lifecycle Monitoring System
ECHO ============================================================
ECHO         PLMSys - Plate Lifecycle Monitoring System
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
    ECHO [INFO] First time setup detected. Installing dependencies...
    ECHO This may take 1-2 minutes depending on your connection...
    ECHO.
    CALL npm install
    if %errorlevel% neq 0 (
        ECHO.
        ECHO [ERROR] Dependency installation failed!
        PAUSE
        EXIT /B 1
    )
    ECHO.
    ECHO [SUCCESS] Dependencies installed successfully!
    ECHO.
)

:: Launch browser in background after 3 seconds
ECHO [INFO] Starting PLMSys Local Web Server on http://localhost:3000 ...
start "" http://localhost:3000

:: Start the application
ECHO.
ECHO ============================================================
ECHO  PLMSys is running! Press Ctrl+C in this window to stop.
ECHO ============================================================
ECHO.
CALL npm run dev

PAUSE
