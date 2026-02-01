@echo off
REM ==================================================
REM ASU Dorms - One Click Startup
REM ==================================================
REM Opens 4 windows: Backend, Backend Tunnel, Frontend, Frontend Tunnel

title ASU Dorms - Startup

cd /d "%~dp0"

PowerShell -ExecutionPolicy Bypass -File "%~dp0Start-Everything.ps1"

pause