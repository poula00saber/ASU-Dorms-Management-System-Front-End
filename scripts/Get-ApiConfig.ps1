<#
.SYNOPSIS
    Shows the current API configuration for the React frontend.
    
.DESCRIPTION
    Displays the current API URL configuration from environment files
    and runtime configuration.
#>

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  ASU Dorms - API Configuration Status" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Get the script's directory and navigate to project root
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir

Write-Host "Project root: $projectRoot" -ForegroundColor Gray
Write-Host ""

# Check each environment file
$envFiles = @(".env", ".env.local", ".env.development", ".env.production")

Write-Host "Environment Files:" -ForegroundColor Yellow
Write-Host "-----------------" -ForegroundColor Gray

foreach ($file in $envFiles) {
    $filePath = Join-Path $projectRoot $file
    if (Test-Path $filePath) {
        Write-Host "  [EXISTS] $file" -ForegroundColor Green
        
        # Read and show VITE_API_URL
        $content = Get-Content $filePath
        $apiUrl = $content | Where-Object { $_ -match "^VITE_API_URL=" } | ForEach-Object { $_ -replace "VITE_API_URL=", "" }
        
        if ($apiUrl) {
            Write-Host "           VITE_API_URL = $apiUrl" -ForegroundColor Cyan
        }
    } else {
        Write-Host "  [MISSING] $file" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Priority Order (highest to lowest):" -ForegroundColor Yellow
Write-Host "  1. .env.local (local overrides, gitignored)" -ForegroundColor White
Write-Host "  2. .env.development / .env.production (mode-specific)" -ForegroundColor White
Write-Host "  3. .env (default values)" -ForegroundColor White
Write-Host ""

# Check index.html runtime config
$indexPath = Join-Path $projectRoot "index.html"
if (Test-Path $indexPath) {
    $indexContent = Get-Content $indexPath -Raw
    if ($indexContent -match "baseUrl:\s*'([^']*)'") {
        $runtimeUrl = $matches[1]
        Write-Host "Runtime Config (index.html):" -ForegroundColor Yellow
        if ($runtimeUrl) {
            Write-Host "  baseUrl = $runtimeUrl" -ForegroundColor Cyan
        } else {
            Write-Host "  baseUrl = (empty - using build-time config)" -ForegroundColor Gray
        }
    }
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To change the API URL:" -ForegroundColor Yellow
Write-Host "  .\scripts\Set-TunnelUrl.ps1 -TunnelUrl 'https://your-url.trycloudflare.com'" -ForegroundColor White
Write-Host ""
