# 青宸智汇 Start All Services
# Usage: powershell -ExecutionPolicy Bypass -File ".\start-all.ps1"

$base = "F:\program open\AI Entrepreneurship Empowerment Platform\program1\ai-mate"

Write-Host "Starting 青宸智汇 Platform..." -ForegroundColor Green

Write-Host "Starting sub-apps..." -ForegroundColor Yellow

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$base\vue-community'; npm run dev"
Write-Host "  [OK] vue-community (3001)" -ForegroundColor Gray

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$base\vue-resource'; npm run dev"
Write-Host "  [OK] vue-resource (3002)" -ForegroundColor Gray

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$base\vue-dashboard'; npm run dev"
Write-Host "  [OK] vue-dashboard (3003)" -ForegroundColor Gray

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$base\vue-user'; npm run dev"
Write-Host "  [OK] vue-user (3004)" -ForegroundColor Gray

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$base\react-ai-chat'; npm run dev"
Write-Host "  [OK] react-ai-chat (4001)" -ForegroundColor Gray

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$base\react-bp-gen'; npm run dev"
Write-Host "  [OK] react-bp-gen (4002)" -ForegroundColor Gray

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$base\react-collab'; npm run dev"
Write-Host "  [OK] react-collab (4003)" -ForegroundColor Gray

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$base\serverless-proxy'; `$env:PORT='9000'; npm start"
Write-Host "  [OK] serverless-proxy (9000)" -ForegroundColor Gray

Write-Host ""
Write-Host "Waiting 15s for sub-apps..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host "Starting main-app..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$base\main-app'; npm run dev"
Write-Host "  [OK] main-app (3000)" -ForegroundColor Gray

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  青宸智汇 Platform Started!" -ForegroundColor Green
Write-Host "  URL: http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Account: test@aimate.com / Test1234" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Green
