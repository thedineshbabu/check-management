# Frontend Server Startup Script for Windows PowerShell
# Starts only the frontend server

# Get the project root directory
$PROJECT_ROOT = Split-Path -Parent $PSScriptRoot
$FRONTEND_DIR = Join-Path $PROJECT_ROOT "frontend"

Write-Host "🚀 Starting Frontend Server...`n" -ForegroundColor Cyan

# Check if frontend directory exists
if (-not (Test-Path $FRONTEND_DIR)) {
    Write-Host "❌ Error: Frontend directory not found at $FRONTEND_DIR" -ForegroundColor Red
    exit 1
}

# Check if node_modules exist
if (-not (Test-Path (Join-Path $FRONTEND_DIR "node_modules"))) {
    Write-Host "⚠️  Frontend dependencies not found. Installing...`n" -ForegroundColor Yellow
    Set-Location $FRONTEND_DIR
    npm install
}

# Start frontend server
Set-Location $FRONTEND_DIR
Write-Host "🌐 Frontend App will be available at: http://localhost:3000`n" -ForegroundColor Green
npm run dev

