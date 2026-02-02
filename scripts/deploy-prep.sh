#!/bin/bash

# Deployment Preparation Script
# Checks if the project is ready for deployment

echo "🚀 Checking deployment readiness..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Check if .env files are in .gitignore
echo "Checking .gitignore..."
if grep -q "\.env" .gitignore; then
    echo -e "${GREEN}✓ .env files are in .gitignore${NC}"
else
    echo -e "${RED}✗ .env files are NOT in .gitignore${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check if migrations exist
echo "Checking database migrations..."
MIGRATIONS=(
    "database/migrations/001_initial_schema.sql"
    "database/migrations/002_add_opening_balance.sql"
    "database/migrations/003_admin_and_registration_codes.sql"
    "database/migrations/004_add_user_expiry.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    if [ -f "$migration" ]; then
        echo -e "${GREEN}✓ $migration exists${NC}"
    else
        echo -e "${RED}✗ $migration missing${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

# Check if backend package.json has start script
echo "Checking backend configuration..."
if grep -q '"start"' backend/package.json; then
    echo -e "${GREEN}✓ Backend start script exists${NC}"
else
    echo -e "${RED}✗ Backend start script missing${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check if frontend package.json has build script
if grep -q '"build"' frontend/package.json; then
    echo -e "${GREEN}✓ Frontend build script exists${NC}"
else
    echo -e "${RED}✗ Frontend build script missing${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check if deployment files exist
echo "Checking deployment configuration files..."
if [ -f "render.yaml" ]; then
    echo -e "${GREEN}✓ render.yaml exists${NC}"
else
    echo -e "${YELLOW}⚠ render.yaml not found (optional)${NC}"
fi

if [ -f "vercel.json" ]; then
    echo -e "${GREEN}✓ vercel.json exists${NC}"
else
    echo -e "${YELLOW}⚠ vercel.json not found (optional)${NC}"
fi

# Summary
echo ""
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready for deployment.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review DEPLOYMENT.md for detailed instructions"
    echo "2. Set up Supabase database"
    echo "3. Deploy backend to Render"
    echo "4. Deploy frontend to Vercel"
    exit 0
else
    echo -e "${RED}❌ Found $ERRORS issue(s). Please fix them before deploying.${NC}"
    exit 1
fi

