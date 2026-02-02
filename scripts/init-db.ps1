# Database Initialization Script for Windows PowerShell
# This script initializes the PostgreSQL database with the schema
# Make sure Docker container is running before executing this script

Write-Host "🚀 Initializing Check Management Database..." -ForegroundColor Cyan

# Database connection parameters (matching docker-compose.yml)
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "check_management"
$DB_USER = "postgres"
$DB_PASSWORD = "postgres"

# Migration files (relative to scripts directory)
$MIGRATIONS_DIR = Join-Path $PSScriptRoot "..\database\migrations"
$MIGRATION_001 = Join-Path $MIGRATIONS_DIR "001_initial_schema.sql"
$MIGRATION_002 = Join-Path $MIGRATIONS_DIR "002_add_opening_balance.sql"
$MIGRATION_003 = Join-Path $MIGRATIONS_DIR "003_admin_and_registration_codes.sql"
$MIGRATION_004 = Join-Path $MIGRATIONS_DIR "004_add_user_expiry.sql"

# Check if Docker container is running
$containerRunning = docker ps --filter "name=check-management-postgres" --format "{{.Names}}" 2>&1
if (-not $containerRunning -or $containerRunning -match "error") {
    Write-Host "ERROR: PostgreSQL container 'check-management-postgres' is not running" -ForegroundColor Red
    Write-Host "TIP: Start it with: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

# Check if migration files exist
if (-not (Test-Path $MIGRATION_001)) {
    Write-Host "ERROR: Migration file not found at $MIGRATION_001" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $MIGRATION_002)) {
    Write-Host "WARNING: Migration file not found at $MIGRATION_002" -ForegroundColor Yellow
    Write-Host "Continuing with initial schema only..." -ForegroundColor Yellow
}

# Run first migration
Write-Host "Running migration: 001_initial_schema.sql" -ForegroundColor Yellow
$migrationContent = Get-Content $MIGRATION_001 -Raw
$migrationContent | docker exec -i check-management-postgres psql -U $DB_USER -d $DB_NAME 2>&1

# Check exit code
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Database initialization failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit 1
}

# Run second migration if it exists
if (Test-Path $MIGRATION_002) {
    Write-Host "Running migration: 002_add_opening_balance.sql" -ForegroundColor Yellow
    $migrationContent = Get-Content $MIGRATION_002 -Raw
    $migrationContent | docker exec -i check-management-postgres psql -U $DB_USER -d $DB_NAME 2>&1
    
    # Check exit code
    if ($LASTEXITCODE -ne 0) {
        Write-Host "WARNING: Migration 002 failed, but database may still be usable" -ForegroundColor Yellow
    }
}

# Run third migration if it exists
if (Test-Path $MIGRATION_003) {
    Write-Host "Running migration: 003_admin_and_registration_codes.sql" -ForegroundColor Yellow
    $migrationContent = Get-Content $MIGRATION_003 -Raw
    $migrationContent | docker exec -i check-management-postgres psql -U $DB_USER -d $DB_NAME 2>&1
    
    # Check exit code
    if ($LASTEXITCODE -ne 0) {
        Write-Host "WARNING: Migration 003 failed, but database may still be usable" -ForegroundColor Yellow
    }
}

# Run fourth migration if it exists
if (Test-Path $MIGRATION_004) {
    Write-Host "Running migration: 004_add_user_expiry.sql" -ForegroundColor Yellow
    $migrationContent = Get-Content $MIGRATION_004 -Raw
    $migrationContent | docker exec -i check-management-postgres psql -U $DB_USER -d $DB_NAME 2>&1
    
    # Check exit code
    if ($LASTEXITCODE -ne 0) {
        Write-Host "WARNING: Migration 004 failed, but database may still be usable" -ForegroundColor Yellow
    }
}

Write-Host "SUCCESS: Database initialized successfully!" -ForegroundColor Green
Write-Host "Tables created: users, bank_accounts, checks, registration_codes" -ForegroundColor Green
Write-Host "Columns added: opening_balance to bank_accounts, is_admin to users, expiry_time to users" -ForegroundColor Green
Write-Host ""
Write-Host "NOTE: To create an admin user, use the admin dashboard after registering a user." -ForegroundColor Yellow
Write-Host "      Or manually update a user: UPDATE users SET is_admin = TRUE WHERE email = 'your-email@example.com';" -ForegroundColor Yellow
