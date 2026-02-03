@echo off
REM ==================================================
REM ASU Dorms - PRODUCTION MODE (24/7 Server)
REM ==================================================
REM This script:
REM 1. Starts Backend API
REM 2. Creates tunnel and captures URL
REM 3. Saves URL to CURRENT-API-URL.txt
REM 4. Starts Frontend
REM
REM Share CURRENT-API-URL.txt with your 40 users!
REM ==================================================

title ASU Dorms - Production Mode

cd /d "%~dp0"

PowerShell -ExecutionPolicy Bypass -File "%~dp0Start-Production.ps1"

pause
