@echo off
setlocal enabledelayedexpansion
TITLE PLMSys - Plate Lifecycle Monitoring System
cd /d "%~dp0"

ECHO ============================================================
ECHO         PLMSys - Plate Lifecycle Monitoring System
ECHO ============================================================
ECHO.

:: 1. Check if user is running directly inside an unextracted ZIP
if not exist "package.json" (
    ECHO [ERROR] package.json not found in the current directory!
    ECHO.
    ECHO It looks like you may be running this script directly from
    ECHO inside a compressed ZIP file without extracting it first.
    ECHO.
    ECHO SOLUTION:
    ECHO 1. Close this window.
    ECHO 2. Right-click the downloaded .ZIP file and select "Extract All..."
    ECHO 3. Open the extracted folder and double-click START.bat again.
    ECHO.
    PAUSE
    EXIT /B 1
)

:: 2. Check if Node.js is in PATH or standard installation directories
where node >nul 2>nul
if %errorlevel% neq 0 (
    if exist "%ProgramFiles%\nodejs\node.exe" (
        set "PATH=%ProgramFiles%\nodejs;%PATH%"
    ) else if exist "%ProgramFiles(x86)%\nodejs\node.exe" (
        set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
    ) else if exist "%LOCALAPPDATA%\Programs\node\node.exe" (
        set "PATH=%LOCALAPPDATA%\Programs\node;%PATH%"
    )
)

where node >nul 2>nul
if %errorlevel% neq 0 (
    ECHO [ERROR] Node.js is not installed or not found in system PATH.
    ECHO.
    ECHO To run the full development server:
    ECHO 1. Download and install Node.js (LTS version) from: https://nodejs.org/
    ECHO 2. During installation, ensure "Add to PATH" is checked.
    ECHO 3. Restart this batch file after installation.
    ECHO.
    ECHO TIP: If you want to run PLMSys without installing Node.js,
    ECHO      you can double-click "START-MINISERVE.bat" instead!
    ECHO.
    PAUSE
    EXIT /B 1
)

:: 3. Check if node_modules directory exists
if not exist "node_modules\" (
    ECHO [INFO] First-time setup detected. Installing dependencies...
    ECHO This may take 1-2 minutes depending on your internet connection...
    ECHO.
    CALL npm install
    if !errorlevel! neq 0 (
        ECHO.
        ECHO [ERROR] Dependency installation failed!
        ECHO Please check your internet connection and try running 'npm install' manually.
        ECHO.
        PAUSE
        EXIT /B 1
    )
    ECHO.
    ECHO [SUCCESS] Dependencies installed successfully!
    ECHO.
)

:: 4. Launch browser in background
ECHO [INFO] Starting PLMSys Local Web Server on http://localhost:3000 ...
start "" "http://localhost:3000"

:: 5. Start the application
ECHO.
ECHO ============================================================
ECHO  PLMSys is running! Keep this window open while using the app.
ECHO  To stop the server, press Ctrl+C in this window.
ECHO ============================================================
ECHO.
CALL npm run dev

if %errorlevel% neq 0 (
    ECHO.
    ECHO [WARNING] Server stopped with exit code %errorlevel%.
)

PAUSE
