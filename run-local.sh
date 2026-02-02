#!/bin/bash

# ============================================
# Check Management App - Local Development
# ============================================
# This script sets up and runs the app locally
# Usage: ./run-local.sh [options]
#   --setup     First-time setup (install deps, create .env)
#   --db-local  Use local PostgreSQL instead of Supabase
#   --help      Show this help message
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# Default configuration
USE_LOCAL_DB=false
RUN_SETUP=false

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --setup) RUN_SETUP=true ;;
        --db-local) USE_LOCAL_DB=true ;;
        --help) 
            echo "Usage: ./run-local.sh [options]"
            echo "  --setup     First-time setup (install deps, create .env)"
            echo "  --db-local  Use local PostgreSQL instead of Supabase"
            echo "  --help      Show this help message"
            exit 0
            ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Check Management - Local Dev Setup   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# ------------------------------
# Check Prerequisites
# ------------------------------
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}✗ Node.js is not installed${NC}"
        echo "  Install from: https://nodejs.org/"
        exit 1
    fi
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Node.js ${NODE_VERSION}${NC}"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}✗ npm is not installed${NC}"
        exit 1
    fi
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓ npm v${NPM_VERSION}${NC}"
    
    # Check PostgreSQL (only if using local DB)
    if [ "$USE_LOCAL_DB" = true ]; then
        if ! command -v psql &> /dev/null; then
            echo -e "${RED}✗ PostgreSQL is not installed${NC}"
            echo "  Install with: brew install postgresql@15"
            exit 1
        fi
        PSQL_VERSION=$(psql --version | head -n1)
        echo -e "${GREEN}✓ ${PSQL_VERSION}${NC}"
        
        # Check if PostgreSQL is running
        if ! pg_isready &> /dev/null; then
            echo -e "${YELLOW}⚠ PostgreSQL is not running. Starting...${NC}"
            brew services start postgresql@15 2>/dev/null || brew services start postgresql 2>/dev/null || {
                echo -e "${RED}✗ Could not start PostgreSQL${NC}"
                echo "  Try: brew services start postgresql"
                exit 1
            }
            sleep 2
        fi
        echo -e "${GREEN}✓ PostgreSQL is running${NC}"
    fi
    
    echo ""
}

# ------------------------------
# Setup Environment Files
# ------------------------------
setup_env_files() {
    echo -e "${YELLOW}Setting up environment files...${NC}"
    
    # Backend .env
    if [ ! -f "$BACKEND_DIR/.env" ] || [ "$RUN_SETUP" = true ]; then
        if [ "$USE_LOCAL_DB" = true ]; then
            cat > "$BACKEND_DIR/.env" << EOF
# Backend Environment - Local Development
NODE_ENV=development
PORT=5000

# Local PostgreSQL Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=check_management
DB_USER=postgres
DB_PASSWORD=postgres

# JWT Secret (change in production!)
JWT_SECRET=local-dev-secret-change-in-production-$(date +%s)
EOF
            echo -e "${GREEN}✓ Created backend/.env (local PostgreSQL)${NC}"
        else
            # Use Supabase connection
            cat > "$BACKEND_DIR/.env" << EOF
# Backend Environment - Local Development with Supabase
NODE_ENV=development
PORT=5000

# Supabase Database (Session Pooler - IPv4 compatible)
DATABASE_URL=postgresql://postgres.tgmtqgphoqedjriwraie:thawN92EMzFDB2mW@aws-1-us-east-1.pooler.supabase.com:5432/postgres

# JWT Secret (change in production!)
JWT_SECRET=local-dev-secret-change-in-production-$(date +%s)
EOF
            echo -e "${GREEN}✓ Created backend/.env (Supabase connection)${NC}"
        fi
    else
        echo -e "${GREEN}✓ backend/.env already exists${NC}"
    fi
    
    # Frontend .env (optional - uses proxy in dev)
    if [ ! -f "$FRONTEND_DIR/.env" ]; then
        cat > "$FRONTEND_DIR/.env" << EOF
# Frontend Environment - Local Development
VITE_API_URL=/api
EOF
        echo -e "${GREEN}✓ Created frontend/.env${NC}"
    else
        echo -e "${GREEN}✓ frontend/.env already exists${NC}"
    fi
    
    echo ""
}

# ------------------------------
# Setup Local Database
# ------------------------------
setup_local_database() {
    if [ "$USE_LOCAL_DB" = true ]; then
        echo -e "${YELLOW}Setting up local database...${NC}"
        
        # Create database if it doesn't exist
        if ! psql -lqt | cut -d \| -f 1 | grep -qw check_management; then
            echo "Creating database 'check_management'..."
            createdb check_management 2>/dev/null || psql -c "CREATE DATABASE check_management;" 2>/dev/null || {
                echo -e "${YELLOW}⚠ Database may already exist or requires manual creation${NC}"
            }
        fi
        
        # Run schema
        if [ -f "$PROJECT_DIR/database/supabase-schema.sql" ]; then
            echo "Applying database schema..."
            psql -d check_management -f "$PROJECT_DIR/database/supabase-schema.sql" 2>/dev/null || {
                echo -e "${YELLOW}⚠ Schema may already be applied${NC}"
            }
        fi
        
        echo -e "${GREEN}✓ Local database ready${NC}"
        echo ""
    fi
}

# ------------------------------
# Install Dependencies
# ------------------------------
install_dependencies() {
    echo -e "${YELLOW}Installing dependencies...${NC}"
    
    # Backend
    echo "Installing backend dependencies..."
    cd "$BACKEND_DIR"
    npm install --silent
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
    
    # Frontend
    echo "Installing frontend dependencies..."
    cd "$FRONTEND_DIR"
    npm install --silent
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
    
    cd "$PROJECT_DIR"
    echo ""
}

# ------------------------------
# Run the Application
# ------------------------------
run_app() {
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║        Starting Application...         ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}Backend:${NC}  http://localhost:5000"
    echo -e "${BLUE}Frontend:${NC} http://localhost:3000"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"
    echo ""
    
    # Create a cleanup function
    cleanup() {
        echo ""
        echo -e "${YELLOW}Shutting down servers...${NC}"
        kill $BACKEND_PID 2>/dev/null
        kill $FRONTEND_PID 2>/dev/null
        exit 0
    }
    trap cleanup SIGINT SIGTERM
    
    # Start backend
    echo -e "${BLUE}[Backend]${NC} Starting..."
    cd "$BACKEND_DIR"
    npm run dev &
    BACKEND_PID=$!
    
    # Wait for backend to start
    sleep 2
    
    # Start frontend
    echo -e "${BLUE}[Frontend]${NC} Starting..."
    cd "$FRONTEND_DIR"
    npm run dev &
    FRONTEND_PID=$!
    
    # Wait for both processes
    wait $BACKEND_PID $FRONTEND_PID
}

# ------------------------------
# Validate Setup
# ------------------------------
validate_setup() {
    echo -e "${YELLOW}Validating setup...${NC}"
    
    ERRORS=0
    
    # Check backend files
    if [ ! -f "$BACKEND_DIR/package.json" ]; then
        echo -e "${RED}✗ Missing backend/package.json${NC}"
        ERRORS=$((ERRORS + 1))
    fi
    
    if [ ! -f "$BACKEND_DIR/src/server.js" ]; then
        echo -e "${RED}✗ Missing backend/src/server.js${NC}"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Check frontend files
    if [ ! -f "$FRONTEND_DIR/package.json" ]; then
        echo -e "${RED}✗ Missing frontend/package.json${NC}"
        ERRORS=$((ERRORS + 1))
    fi
    
    if [ ! -f "$FRONTEND_DIR/vite.config.js" ]; then
        echo -e "${RED}✗ Missing frontend/vite.config.js${NC}"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Check node_modules
    if [ ! -d "$BACKEND_DIR/node_modules" ]; then
        echo -e "${YELLOW}⚠ Backend dependencies not installed${NC}"
        RUN_SETUP=true
    fi
    
    if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
        echo -e "${YELLOW}⚠ Frontend dependencies not installed${NC}"
        RUN_SETUP=true
    fi
    
    if [ $ERRORS -gt 0 ]; then
        echo -e "${RED}Found $ERRORS error(s). Please fix before running.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Project structure validated${NC}"
    echo ""
}

# ------------------------------
# Main Execution
# ------------------------------
main() {
    check_prerequisites
    validate_setup
    
    if [ "$RUN_SETUP" = true ]; then
        setup_env_files
        setup_local_database
        install_dependencies
    fi
    
    # Ensure .env exists
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        setup_env_files
    fi
    
    run_app
}

main
