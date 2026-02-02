#!/bin/bash

# Backend Server Startup Script
# Starts only the backend server

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"

echo -e "${CYAN}🚀 Starting Backend Server...${NC}\n"

# Check if backend directory exists
if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}❌ Error: Backend directory not found at $BACKEND_DIR${NC}"
    exit 1
fi

# Check if node_modules exist
if [ ! -d "$BACKEND_DIR/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Backend dependencies not found. Installing...${NC}"
    cd "$BACKEND_DIR"
    npm install
fi

# Check if .env file exists
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo -e "${YELLOW}⚠️  Warning: Backend .env file not found${NC}"
    echo -e "${YELLOW}💡 Create $BACKEND_DIR/.env with database configuration${NC}\n"
fi

# Start backend server
cd "$BACKEND_DIR"
echo -e "${GREEN}📡 Backend API will be available at: http://localhost:5000${NC}\n"
npm run dev

