# Development Server Startup Script for Windows PowerShell
# Starts both backend and frontend servers in separate windows
# Close the windows or press Ctrl+C in each window to stop servers

# Get the project root directory (parent of scripts)
$PROJECT_ROOT = Split-Path -Parent $PSScriptRoot
$BACKEND_DIR = Join-Path $PROJECT_ROOT "backend"
$FRONTEND_DIR = Join-Path $PROJECT_ROOT "frontend"

Write-Host "Starting Check Management Development Servers...`n" -ForegroundColor Cyan

# Check if backend directory exists
if (-not (Test-Path $BACKEND_DIR)) {
    Write-Host "ERROR: Backend directory not found at $BACKEND_DIR" -ForegroundColor Red
    exit 1
}

# Check if frontend directory exists
if (-not (Test-Path $FRONTEND_DIR)) {
    Write-Host "ERROR: Frontend directory not found at $FRONTEND_DIR" -ForegroundColor Red
    exit 1
}

# Check if node_modules exist, if not, install dependencies
if (-not (Test-Path (Join-Path $BACKEND_DIR "node_modules"))) {
    Write-Host "WARNING: Backend dependencies not found. Installing...`n" -ForegroundColor Yellow
    Push-Location $BACKEND_DIR
    npm install
    Pop-Location
}

if (-not (Test-Path (Join-Path $FRONTEND_DIR "node_modules"))) {
    Write-Host "WARNING: Frontend dependencies not found. Installing...`n" -ForegroundColor Yellow
    Push-Location $FRONTEND_DIR
    npm install
    Pop-Location
}

# Check if .env file exists in backend
if (-not (Test-Path (Join-Path $BACKEND_DIR ".env"))) {
    Write-Host "WARNING: Backend .env file not found" -ForegroundColor Yellow
    Write-Host "TIP: Create $BACKEND_DIR\.env with database configuration`n" -ForegroundColor Yellow
}

# Start backend server in a new window
Write-Host "Starting backend server in new window..." -ForegroundColor Blue
try {
    $backendProcess = Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "cd '$BACKEND_DIR'; Write-Host 'Backend Server' -ForegroundColor Green; Write-Host 'URL: http://localhost:5000' -ForegroundColor Cyan; Write-Host ''; npm run dev"
    ) -PassThru
    
    if (-not $backendProcess) {
        throw "Failed to start backend process"
    }
    Write-Host "SUCCESS: Backend server started (PID: $($backendProcess.Id))" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Starting backend server failed: $_" -ForegroundColor Red
    exit 1
}

# Wait a moment before starting frontend
Start-Sleep -Seconds 2

# Start frontend server in a new window
Write-Host "Starting frontend server in new window...`n" -ForegroundColor Blue
try {
    $frontendProcess = Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "cd '$FRONTEND_DIR'; Write-Host 'Frontend Server' -ForegroundColor Green; Write-Host 'URL: http://localhost:3000' -ForegroundColor Cyan; Write-Host ''; npm run dev"
    ) -PassThru
    
    if (-not $frontendProcess) {
        throw "Failed to start frontend process"
    }
    Write-Host "SUCCESS: Frontend server started (PID: $($frontendProcess.Id))" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Starting frontend server failed: $_" -ForegroundColor Red
    Write-Host "TIP: Backend server is still running. Close its window to stop it." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "SUCCESS: Both servers are running!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend API:  http://localhost:5000" -ForegroundColor Green
Write-Host "Frontend App: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "TIP: Each server is running in its own window" -ForegroundColor Yellow
Write-Host "TIP: Close the server windows to stop them" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Keep script running and monitor processes
Write-Host "Monitoring servers... (Press Ctrl+C to exit monitoring)`n" -ForegroundColor Gray

try {
    while ($true) {
        # Check if backend process is still running
        if ($backendProcess -and -not (Get-Process -Id $backendProcess.Id -ErrorAction SilentlyContinue)) {
            Write-Host "WARNING: Backend server window was closed" -ForegroundColor Yellow
            $backendProcess = $null
        }
        
        # Check if frontend process is still running
        if ($frontendProcess -and -not (Get-Process -Id $frontendProcess.Id -ErrorAction SilentlyContinue)) {
            Write-Host "WARNING: Frontend server window was closed" -ForegroundColor Yellow
            $frontendProcess = $null
        }
        
        # Exit if both processes are stopped
        if (-not $backendProcess -and -not $frontendProcess) {
            Write-Host "`nSUCCESS: All servers stopped" -ForegroundColor Green
            break
        }
        
        Start-Sleep -Seconds 2
    }
} catch {
    # Handle Ctrl+C gracefully
    Write-Host "`nSTOPPED: Monitoring stopped" -ForegroundColor Yellow
    Write-Host "TIP: Servers are still running in their windows" -ForegroundColor Yellow
    Write-Host "TIP: Close the server windows to stop them" -ForegroundColor Yellow
}
