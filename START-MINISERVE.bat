@echo off
TITLE PLMSys - Miniserve High-Performance LAN Server
cd /d "%~dp0"

ECHO ============================================================
ECHO     PLMSys - Plate Lifecycle Monitoring System
ECHO            (Miniserve High-Performance Server)
ECHO ============================================================
ECHO.

:: Check if miniserve.exe exists in current folder
if not exist "miniserve.exe" (
    ECHO [ERROR] miniserve.exe not found in this folder!
    ECHO Please make sure miniserve.exe is placed in the same folder as this .bat file.
    ECHO.
    PAUSE
    EXIT /B 1
)

:: Check if dist folder exists
if not exist "dist\index.html" (
    ECHO [ERROR] dist\index.html not found!
    ECHO Please make sure the 'dist' folder is present.
    ECHO.
    PAUSE
    EXIT /B 1
)

ECHO [OK] miniserve.exe found!
ECHO [OK] Production dist folder found!
ECHO.
ECHO ============================================================
ECHO  Local Area Network (LAN) IP Addresses:
ipconfig | findstr /i "IPv4"
ECHO ============================================================
ECHO.
ECHO Starting server on http://localhost:8080 ...
ECHO Tablets / devices on the local network can open:
ECHO http://<YOUR-IP>:8080 (e.g. http://192.168.100.127:8080)
ECHO.

:: Launch browser in background
start "" "http://localhost:8080"

:: Start Miniserve serving the dist directory in SPA mode
ECHO [SERVER ACTIVE] Keep this window open while using PLMSys.
ECHO To stop the server, press Ctrl+C in this window.
ECHO.
miniserve.exe --spa --index index.html -p 8080 -i 0.0.0.0 dist

if %errorlevel% neq 0 (
    ECHO.
    ECHO [WARNING] Server stopped.
)

PAUSE
