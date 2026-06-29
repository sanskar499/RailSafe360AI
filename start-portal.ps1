# RailSafe360 Portal One-Click Startup Script
# Run this script in PowerShell to launch both servers.

Clear-Host
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host "   🚀 RailSafe360 - Safety & Maintenance Portal 🚀   " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host ""

# Verify Node.js
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVer = node -v
    Write-Host "✅ Node.js detected: $nodeVer" -ForegroundColor Green
} else {
    Write-Host "❌ Error: Node.js is not installed or not on PATH." -ForegroundColor Red
    Exit
}

# Boot Backend Server in a new window
Write-Host "📡 Booting Express API Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '📡 RailSafe360 API Server Console' -ForegroundColor Cyan; cd backend; npm run dev"

# Boot Frontend Client in a new window
Write-Host "💻 Booting Vite React Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '💻 RailSafe360 Client Console' -ForegroundColor Cyan; cd frontend; npm run dev"

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "✅ Both servers have been launched in separate consoles!" -ForegroundColor Green
Write-Host "📡 API Service: http://localhost:5000" -ForegroundColor Green
Write-Host "💻 Web Portal: http://localhost:5173" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
