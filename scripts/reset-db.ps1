# Database Reset Script for Windows PowerShell
# WARNING: This will delete all data in the database
# Use with caution in development only

Write-Host "⚠️  WARNING: This will delete all data in the database!" -ForegroundColor Yellow
$confirm = Read-Host "Are you sure you want to continue? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "❌ Operation cancelled" -ForegroundColor Red
    exit 0
}

Write-Host "🔄 Resetting database..." -ForegroundColor Cyan

# Stop and remove container
docker-compose down -v

# Start fresh container
docker-compose up -d

# Wait for PostgreSQL to be ready
Write-Host "⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Run initialization script
& "$PSScriptRoot\init-db.ps1"

Write-Host "✅ Database reset complete!" -ForegroundColor Green

