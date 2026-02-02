# Deployment Preparation Script for Windows PowerShell
# Checks if the project is ready for deployment

Write-Host "🚀 Checking deployment readiness..." -ForegroundColor Cyan
Write-Host ""

$Errors = 0

# Check if .env files are in .gitignore
Write-Host "Checking .gitignore..."
if (Get-Content .gitignore | Select-String -Pattern "\.env") {
    Write-Host "✓ .env files are in .gitignore" -ForegroundColor Green
} else {
    Write-Host "✗ .env files are NOT in .gitignore" -ForegroundColor Red
    $Errors++
}

# Check if migrations exist
Write-Host "Checking database migrations..."
$Migrations = @(
    "database\migrations\001_initial_schema.sql",
    "database\migrations\002_add_opening_balance.sql",
    "database\migrations\003_admin_and_registration_codes.sql",
    "database\migrations\004_add_user_expiry.sql"
)

foreach ($migration in $Migrations) {
    if (Test-Path $migration) {
        Write-Host "✓ $migration exists" -ForegroundColor Green
    } else {
        Write-Host "✗ $migration missing" -ForegroundColor Red
        $Errors++
    }
}

# Check if backend package.json has start script
Write-Host "Checking backend configuration..."
if (Get-Content backend\package.json | Select-String -Pattern '"start"') {
    Write-Host "✓ Backend start script exists" -ForegroundColor Green
} else {
    Write-Host "✗ Backend start script missing" -ForegroundColor Red
    $Errors++
}

# Check if frontend package.json has build script
if (Get-Content frontend\package.json | Select-String -Pattern '"build"') {
    Write-Host "✓ Frontend build script exists" -ForegroundColor Green
} else {
    Write-Host "✗ Frontend build script missing" -ForegroundColor Red
    $Errors++
}

# Check if deployment files exist
Write-Host "Checking deployment configuration files..."
if (Test-Path "render.yaml") {
    Write-Host "✓ render.yaml exists" -ForegroundColor Green
} else {
    Write-Host "⚠ render.yaml not found (optional)" -ForegroundColor Yellow
}

if (Test-Path "vercel.json") {
    Write-Host "✓ vercel.json exists" -ForegroundColor Green
} else {
    Write-Host "⚠ vercel.json not found (optional)" -ForegroundColor Yellow
}

# Summary
Write-Host ""
if ($Errors -eq 0) {
    Write-Host "✅ All checks passed! Ready for deployment." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "1. Review DEPLOYMENT.md for detailed instructions"
    Write-Host "2. Set up Supabase database"
    Write-Host "3. Deploy backend to Render"
    Write-Host "4. Deploy frontend to Vercel"
    exit 0
} else {
    Write-Host "❌ Found $Errors issue(s). Please fix them before deploying." -ForegroundColor Red
    exit 1
}

