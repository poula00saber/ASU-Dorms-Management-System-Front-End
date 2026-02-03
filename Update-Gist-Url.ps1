<#
.SYNOPSIS
    Updates the current API URL to a GitHub Gist for easy sharing
.DESCRIPTION
    This script updates a GitHub Gist with the current tunnel URL.
    Your 40 users can bookmark the Gist URL - it never changes!
    
    SETUP (one-time):
    1. Go to https://gist.github.com and create a new Gist
    2. Name the file: current-url.txt
    3. Save the Gist and copy its ID from the URL
    4. Go to https://github.com/settings/tokens and create a token with 'gist' scope
    5. Update the variables below
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$TunnelUrl
)

# ============================================
# CONFIGURATION - UPDATE THESE!
# ============================================
$GistId = "YOUR_GIST_ID_HERE"           # e.g., "abc123def456"
$GitHubToken = "YOUR_GITHUB_TOKEN_HERE" # Create at github.com/settings/tokens
$GistFileName = "current-url.txt"
# ============================================

if ($GistId -eq "YOUR_GIST_ID_HERE" -or $GitHubToken -eq "YOUR_GITHUB_TOKEN_HERE") {
    Write-Host "ERROR: Please configure GistId and GitHubToken in this script" -ForegroundColor Red
    Write-Host ""
    Write-Host "SETUP INSTRUCTIONS:" -ForegroundColor Yellow
    Write-Host "1. Go to https://gist.github.com" -ForegroundColor White
    Write-Host "2. Create a new Gist with filename: current-url.txt" -ForegroundColor White
    Write-Host "3. Copy the Gist ID from the URL (the long string after your username)" -ForegroundColor White
    Write-Host "4. Go to https://github.com/settings/tokens" -ForegroundColor White
    Write-Host "5. Create a token with 'gist' scope" -ForegroundColor White
    Write-Host "6. Update this script with your GistId and GitHubToken" -ForegroundColor White
    exit 1
}

$content = @"
===============================================
ASU DORMS MANAGEMENT SYSTEM
===============================================
Last Updated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

CURRENT API URL:
$TunnelUrl

SWAGGER DOCUMENTATION:
$TunnelUrl/swagger

===============================================
Bookmark THIS page - the URL above may change
but this Gist URL stays the same!
===============================================
"@

$body = @{
    files = @{
        $GistFileName = @{
            content = $content
        }
    }
} | ConvertTo-Json

$headers = @{
    "Authorization" = "token $GitHubToken"
    "Accept" = "application/vnd.github.v3+json"
}

try {
    $response = Invoke-RestMethod -Uri "https://api.github.com/gists/$GistId" -Method Patch -Headers $headers -Body $body -ContentType "application/json"
    Write-Host "SUCCESS: Gist updated!" -ForegroundColor Green
    Write-Host "Share this URL with your users: https://gist.github.com/$GistId" -ForegroundColor Yellow
} catch {
    Write-Host "ERROR: Failed to update Gist" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
