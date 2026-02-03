<#
.SYNOPSIS
    One-click production startup - fully automated
.DESCRIPTION
    1. Starts Backend API
    2. Starts Backend Tunnel (captures URL automatically)
    3. Updates .env.local automatically
    4. Starts Frontend
    5. Starts Frontend Tunnel
    6. Shows you the URL to share!
#>

$ErrorActionPreference = "Continue"

$BackendDir = "C:\Users\Poula Saber\source\repos\ASU Dorms Management System\ASU Dorms Management System"
$FrontendDir = $PSScriptRoot
$cloudflared = "C:\cloudflared\cloudflared.exe"
$UrlFile = "$PSScriptRoot\CURRENT-URLS.txt"

Clear-Host
Write-Host ""
Write-Host "  ============================================" -ForegroundColor Cyan
Write-Host "    ASU DORMS - STARTING (Please wait...)" -ForegroundColor Cyan
Write-Host "  ============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Start Backend API
Write-Host "[1/5] Starting Backend API..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$host.UI.RawUI.WindowTitle = 'BACKEND API'; Set-Location '$BackendDir'; dotnet run --urls http://localhost:5065"
Start-Sleep -Seconds 20

# 2. Start Backend Tunnel and capture URL
Write-Host "[2/5] Starting Backend Tunnel..." -ForegroundColor Yellow
$backendLog = "$env:TEMP\backend_tunnel.log"
Remove-Item $backendLog -Force -ErrorAction SilentlyContinue

# Start tunnel and log to file (also show in visible window)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$host.UI.RawUI.WindowTitle = 'BACKEND TUNNEL'; & '$cloudflared' tunnel --url http://localhost:5065 2>&1 | Tee-Object -FilePath '$backendLog'"

# Wait for URL to appear
$backendUrl = $null
for ($i = 1; $i -le 20; $i++) {
    Start-Sleep -Seconds 1
    if (Test-Path $backendLog) {
        $content = Get-Content $backendLog -Raw -ErrorAction SilentlyContinue
        if ($content -match '(https://[a-z0-9-]+\.trycloudflare\.com)') {
            $backendUrl = $Matches[1]
            break
        }
    }
    Write-Host "      Waiting... ($i/20)" -ForegroundColor Gray
}

if ($backendUrl) {
    Write-Host "      Backend: $backendUrl" -ForegroundColor Green
    
    # Update .env files
    "VITE_API_URL=$backendUrl" | Set-Content "$FrontendDir\.env.local" -Encoding UTF8
    "VITE_API_URL=$backendUrl" | Set-Content "$FrontendDir\.env.development" -Encoding UTF8
    
    # ALSO update index.html runtime config (this works even if Vite caches env vars)
    $indexPath = "$FrontendDir\index.html"
    $indexContent = Get-Content $indexPath -Raw
    $indexContent = $indexContent -replace 'baseUrl:\s*"[^"]*"', "baseUrl: `"$backendUrl`""
    $indexContent | Set-Content $indexPath -Encoding UTF8 -NoNewline
    
    Write-Host "      .env files + index.html updated!" -ForegroundColor Cyan
} else {
    Write-Host "      [!] Could not capture backend URL" -ForegroundColor Red
    exit 1
}

# 3. Start Frontend (AFTER .env.local is updated!)
Write-Host "[3/5] Starting Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$host.UI.RawUI.WindowTitle = 'FRONTEND'; Set-Location '$FrontendDir'; Write-Host 'Using API: $backendUrl' -ForegroundColor Yellow; npm run dev"
Start-Sleep -Seconds 15

# 4. Start Frontend Tunnel and capture URL
Write-Host "[4/5] Starting Frontend Tunnel..." -ForegroundColor Yellow
$frontendLog = "$env:TEMP\frontend_tunnel.log"
Remove-Item $frontendLog -Force -ErrorAction SilentlyContinue

Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$host.UI.RawUI.WindowTitle = 'FRONTEND TUNNEL'; & '$cloudflared' tunnel --url http://localhost:5173 2>&1 | Tee-Object -FilePath '$frontendLog'"

$frontendUrl = $null
for ($i = 1; $i -le 20; $i++) {
    Start-Sleep -Seconds 1
    if (Test-Path $frontendLog) {
        $content = Get-Content $frontendLog -Raw -ErrorAction SilentlyContinue
        if ($content -match '(https://[a-z0-9-]+\.trycloudflare\.com)') {
            $frontendUrl = $Matches[1]
            break
        }
    }
    Write-Host "      Waiting... ($i/20)" -ForegroundColor Gray
}

if ($frontendUrl) {
    Write-Host "      Frontend: $frontendUrl" -ForegroundColor Green
} else {
    Write-Host "      [!] Could not capture frontend URL" -ForegroundColor Red
    exit 1
}

# 5. Save URLs to file
Write-Host "[5/5] Saving URLs..." -ForegroundColor Yellow
@"
===============================================
ASU DORMS - ACCESS URLS
Updated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
===============================================

SHARE THIS WITH YOUR 40 USERS:
$frontendUrl

Backend API (internal):
$backendUrl

===============================================
"@ | Set-Content $UrlFile -Encoding UTF8

# Copy to clipboard
$frontendUrl | Set-Clipboard

# Done!
Write-Host ""
Write-Host "  ============================================" -ForegroundColor Green
Write-Host "    READY!" -ForegroundColor Green
Write-Host "  ============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  ============================================" -ForegroundColor Yellow
Write-Host "  SHARE THIS URL WITH YOUR 40 USERS:" -ForegroundColor Yellow
Write-Host "  ============================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "  $frontendUrl" -ForegroundColor Green
Write-Host ""
Write-Host "  (Copied to clipboard!)" -ForegroundColor Cyan
Write-Host ""
Write-Host "  ============================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "  URLs also saved to: CURRENT-URLS.txt" -ForegroundColor Gray
Write-Host ""
Write-Host "  DO NOT CLOSE THE MINIMIZED TUNNEL WINDOWS!" -ForegroundColor Red
Write-Host ""
Write-Host "  Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
