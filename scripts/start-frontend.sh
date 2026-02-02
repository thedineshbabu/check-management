#!/bin/bash

# Frontend Server Startup Script
# Starts only the frontend server

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
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo -e "${CYAN}🚀 Starting Frontend Server...${NC}\n"

# Check if frontend directory exists
if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}❌ Error: Frontend directory not found at $FRONTEND_DIR${NC}"
    exit 1
fi

# Check if node_modules exist
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Frontend dependencies not found. Installing...${NC}"
    cd "$FRONTEND_DIR"
    npm install
fi

# Start frontend server
cd "$FRONTEND_DIR"
echo -e "${GREEN}🌐 Frontend App will be available at: http://localhost:3000${NC}\n"
npm run dev

