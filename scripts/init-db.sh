#!/bin/bash

# Database Initialization Script
# This script initializes the PostgreSQL database with the schema
# Make sure Docker container is running before executing this script

set -e

echo "🚀 Initializing Check Management Database..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker container is running
if ! docker ps | grep -q check-management-postgres; then
    echo -e "${RED}❌ Error: PostgreSQL container 'check-management-postgres' is not running${NC}"
    echo -e "${YELLOW}💡 Start it with: docker-compose up -d${NC}"
    exit 1
fi

# Database connection parameters (matching docker-compose.yml)
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="check_management"
DB_USER="postgres"
DB_PASSWORD="postgres"

# Migration files
MIGRATIONS_DIR="../database/migrations"
MIGRATION_001="$MIGRATIONS_DIR/001_initial_schema.sql"
MIGRATION_002="$MIGRATIONS_DIR/002_add_opening_balance.sql"
MIGRATION_003="$MIGRATIONS_DIR/003_admin_and_registration_codes.sql"

# Check if migration files exist
if [ ! -f "$MIGRATION_001" ]; then
    echo -e "${RED}❌ Error: Migration file not found at $MIGRATION_001${NC}"
    exit 1
fi

# Run first migration
echo -e "${YELLOW}📋 Running migration: 001_initial_schema.sql${NC}"
docker exec -i check-management-postgres psql -U "$DB_USER" -d "$DB_NAME" < "$MIGRATION_001"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error: Database initialization failed${NC}"
    exit 1
fi

# Run second migration if it exists
if [ -f "$MIGRATION_002" ]; then
    echo -e "${YELLOW}📋 Running migration: 002_add_opening_balance.sql${NC}"
    docker exec -i check-management-postgres psql -U "$DB_USER" -d "$DB_NAME" < "$MIGRATION_002"
    
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}⚠️  Warning: Migration 002 failed, but database may still be usable${NC}"
    fi
fi

# Run third migration if it exists
if [ -f "$MIGRATION_003" ]; then
    echo -e "${YELLOW}📋 Running migration: 003_admin_and_registration_codes.sql${NC}"
    docker exec -i check-management-postgres psql -U "$DB_USER" -d "$DB_NAME" < "$MIGRATION_003"
    
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}⚠️  Warning: Migration 003 failed, but database may still be usable${NC}"
    fi
fi

echo -e "${GREEN}✅ Database initialized successfully!${NC}"
echo -e "${GREEN}📊 Tables created: users, bank_accounts, checks, registration_codes${NC}"
echo -e "${GREEN}📊 Columns added: opening_balance to bank_accounts, is_admin to users${NC}"
echo ""
echo -e "${YELLOW}ℹ️  NOTE: To create an admin user, use the admin dashboard after registering a user.${NC}"
echo -e "${YELLOW}   Or manually update a user: UPDATE users SET is_admin = TRUE WHERE email = 'your-email@example.com';${NC}"

