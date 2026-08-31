@echo off
TITLE PLMSys - Windows Wi-Fi Network & Firewall Checker
cd /d "%~dp0"

ECHO ============================================================
ECHO     PLMSys - Wi-Fi Network Profile & Firewall Checker
ECHO ============================================================
ECHO.

:: 1. Check current network profile
ECHO ------------------------------------------------------------
ECHO 1. Current Network Profile (Public vs Private):
ECHO ------------------------------------------------------------
powershell -NoProfile -Command "$profiles = Get-NetConnectionProfile; foreach ($p in $profiles) { Write-Host 'Interface:' $p.InterfaceAlias '- Name:' $p.Name '- Category:' $p.NetworkCategory }"

ECHO.
ECHO NOTE: To allow tablets/phones on your Wi-Fi to connect,
ECHO your network category MUST be 'Private' (not Public).
ECHO.

:: 2. Show LAN IPv4
ECHO ------------------------------------------------------------
ECHO 2. Local Area Network (IPv4) Addresses:
ECHO ------------------------------------------------------------
ipconfig | findstr /i "IPv4"

ECHO.
ECHO ============================================================
ECHO Action Menu:
ECHO   [1] Switch all active network profiles to PRIVATE (Recommended)
ECHO   [2] Add Port 3000 Firewall Inbound Rule (Allows Phones/Tablets)
ECHO   [3] Do Both (Switch to Private + Add Port 3000 Rule)
ECHO   [4] Exit
ECHO ============================================================
set /p choice="Enter choice (1, 2, 3, 4): "

if "%choice%"=="1" (
    ECHO.
    ECHO Setting network category to Private (Administrator prompt will appear)...
    powershell -Command "Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile -Command Get-NetConnectionProfile | Set-NetConnectionProfile -NetworkCategory Private; Write-Host \"[SUCCESS] Network profile changed to Private!\"; Start-Sleep -Seconds 2'"
) else if "%choice%"=="2" (
    ECHO.
    ECHO Creating Firewall Rule for Port 3000...
    powershell -Command "Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile -Command New-NetFirewallRule -DisplayName \"PLMSys Server Port 3000\" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow; Write-Host \"[SUCCESS] Firewall Rule Created for Port 3000!\"; Start-Sleep -Seconds 2'"
) else if "%choice%"=="3" (
    ECHO.
    ECHO Applying both fixes (Private Network + Firewall Rule)...
    powershell -Command "Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile -Command Get-NetConnectionProfile | Set-NetConnectionProfile -NetworkCategory Private; New-NetFirewallRule -DisplayName \"PLMSys Server Port 3000\" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue; Write-Host \"[SUCCESS] Network set to Private and Port 3000 Firewall Rule enabled!\"; Start-Sleep -Seconds 3'"
)

ECHO.
ECHO Done!
PAUSE
