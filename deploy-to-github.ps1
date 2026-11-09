# Smart Ambulance Routing - 1-Click GitHub & Render Deploy Helper
param(
    [string]$repoUrl
)

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  SMART AMBULANCE ROUTING - GITHUB & RENDER DEPLOYER" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan

if (-not $repoUrl) {
    Write-Host "`nStep 1: Go to https://github.com/new and create a new repository (e.g., smart-ambulance-routing)." -ForegroundColor White
    $repoUrl = Read-Host "`nEnter your GitHub repository URL (e.g. https://github.com/your-username/smart-ambulance-routing.git)"
}

if (-not $repoUrl) {
    Write-Host "No URL provided. Exiting." -ForegroundColor Red
    exit 1
}

Write-Host "`nLinking to remote repository: $repoUrl ..." -ForegroundColor Cyan
git remote remove origin 2>$null
git remote add origin $repoUrl
git branch -M main
git add .
git commit -m "feat: complete smart ambulance routing web app" 2>$null

Write-Host "Pushing code to GitHub..." -ForegroundColor Cyan
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "`nStep 2: Open Render to create your live link:" -ForegroundColor Yellow
    Write-Host "👉 https://dashboard.render.com/static/new" -ForegroundColor Cyan
    Write-Host "Select your repository and click 'Create Static Site'."
    Write-Host "Your website will be live in 30 seconds at: https://smart-ambulance-routing.onrender.com`n" -ForegroundColor Green
    Start-Process "https://dashboard.render.com/static/new"
} else {
    Write-Host "`n❌ Push failed. Please check your GitHub credentials or repo URL." -ForegroundColor Red
}
