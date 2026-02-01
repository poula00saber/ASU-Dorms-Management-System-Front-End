<#
.SYNOPSIS
    One-click startup for ASU Dorms Management System
.DESCRIPTION
    Opens 4 PowerShell windows:
    1. Backend API
    2. Backend Tunnel (Named: asudorms)
    3. Frontend Dev Server
    4. Frontend Tunnel (Named: asudorms-frontend)
    
    PERMANENT URLs:
    - API:      https://api.asudorms.com
    - Frontend: https://app.asudorms.com
#>

$ErrorActionPreference = "Stop"

# ============================================
# CONFIGURATION - PERMANENT URLs
# ============================================
$BackendTunnel = "asudorms"           # https://api.asudorms.com
$FrontendTunnel = "asudorms-frontend" # https://app.asudorms.com
$BackendDir = "C:\Users\Poula Saber\source\repos\ASU Dorms Management System\ASU Dorms Management System"
$FrontendDir = $PSScriptRoot

# ============================================

Clear-Host
Write-Host ""
Write-Host "  ============================================" -ForegroundColor Cyan
Write-Host "    ASU DORMS - ONE CLICK STARTUP" -ForegroundColor Cyan
Write-Host "    PERMANENT URLs (Named Tunnels)" -ForegroundColor Cyan
Write-Host "  ============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  API:      https://api.asudorms.com" -ForegroundColor Green
Write-Host "  Frontend: https://app.asudorms.com" -ForegroundColor Green
Write-Host ""

# Check cloudflared
$cloudflared = "cloudflared"
if (Test-Path "C:\cloudflared\cloudflared.exe") {
    $cloudflared = "C:\cloudflared\cloudflared.exe"
}

Write-Host "[1/4] Starting Backend API..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$BackendDir'; Write-Host 'BACKEND API - Port 5065' -ForegroundColor Cyan; dotnet run --urls http://localhost:5065"

Write-Host "      Waiting 15 seconds for API to start..." -ForegroundColor Gray
Start-Sleep -Seconds 15

Write-Host "[2/4] Starting Backend Tunnel ($BackendTunnel)..." -ForegroundColor Yellow
$backendTunnelScript = @"
Write-Host '================================================' -ForegroundColor Green
Write-Host '  BACKEND API TUNNEL' -ForegroundColor Green
Write-Host '  https://api.asudorms.com' -ForegroundColor Yellow
Write-Host '================================================' -ForegroundColor Green
Write-Host ''
& '$cloudflared' tunnel run --url http://localhost:5065 $BackendTunnel
"@
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendTunnelScript

Write-Host "      Waiting 10 seconds for tunnel..." -ForegroundColor Gray
Start-Sleep -Seconds 10

Write-Host "[3/4] Starting Frontend Dev Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$FrontendDir'; Write-Host 'FRONTEND - Port 5173' -ForegroundColor Cyan; npm run dev"

Write-Host "      Waiting 10 seconds for frontend..." -ForegroundColor Gray
Start-Sleep -Seconds 10

Write-Host "[4/4] Starting Frontend Tunnel ($FrontendTunnel)..." -ForegroundColor Yellow
$frontendTunnelScript = @"
Write-Host '================================================' -ForegroundColor Green
Write-Host '  FRONTEND APP TUNNEL' -ForegroundColor Green
Write-Host '  https://app.asudorms.com' -ForegroundColor Yellow
Write-Host '================================================' -ForegroundColor Green
Write-Host ''
& '$cloudflared' tunnel run --url http://localhost:5173 $FrontendTunnel
"@
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendTunnelScript

Write-Host ""
Write-Host "  ============================================" -ForegroundColor Green
Write-Host "    ALL 4 WINDOWS STARTED!" -ForegroundColor Green
Write-Host "  ============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Window 1: Backend API (port 5065)" -ForegroundColor White
Write-Host "  Window 2: Backend Tunnel" -ForegroundColor White
Write-Host "  Window 3: Frontend Dev Server (port 5173)" -ForegroundColor White
Write-Host "  Window 4: Frontend Tunnel" -ForegroundColor White
Write-Host ""
Write-Host "  ============================================" -ForegroundColor Yellow
Write-Host "  SHARE THIS LINK WITH YOUR 40+ USERS:" -ForegroundColor Yellow
Write-Host "  https://app.asudorms.com" -ForegroundColor Green
Write-Host "  ============================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Press any key to exit this launcher..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
