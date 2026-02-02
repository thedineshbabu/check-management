# Backend Server Startup Script for Windows PowerShell
# Starts only the backend server

# Get the project root directory
$PROJECT_ROOT = Split-Path -Parent $PSScriptRoot
$BACKEND_DIR = Join-Path $PROJECT_ROOT "backend"

Write-Host "🚀 Starting Backend Server...`n" -ForegroundColor Cyan

# Check if backend directory exists
if (-not (Test-Path $BACKEND_DIR)) {
    Write-Host "❌ Error: Backend directory not found at $BACKEND_DIR" -ForegroundColor Red
    exit 1
}

# Check if node_modules exist
if (-not (Test-Path (Join-Path $BACKEND_DIR "node_modules"))) {
    Write-Host "⚠️  Backend dependencies not found. Installing...`n" -ForegroundColor Yellow
    Set-Location $BACKEND_DIR
    npm install
}

# Check if .env file exists
if (-not (Test-Path (Join-Path $BACKEND_DIR ".env"))) {
    Write-Host "⚠️  Warning: Backend .env file not found" -ForegroundColor Yellow
    Write-Host "💡 Create $BACKEND_DIR\.env with database configuration`n" -ForegroundColor Yellow
}

# Start backend server
Set-Location $BACKEND_DIR
Write-Host "📡 Backend API will be available at: http://localhost:5000`n" -ForegroundColor Green
npm run dev

