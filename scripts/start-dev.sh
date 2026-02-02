#!/bin/bash

# Development Server Startup Script
# Starts both backend and frontend servers concurrently
# Press Ctrl+C to stop both servers

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get the project root directory (parent of scripts)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Function to cleanup background processes on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down servers...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        echo -e "${GREEN}✅ Backend server stopped${NC}"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        echo -e "${GREEN}✅ Frontend server stopped${NC}"
    fi
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

echo -e "${CYAN}🚀 Starting Check Management Development Servers...${NC}\n"

# Check if backend directory exists
if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}❌ Error: Backend directory not found at $BACKEND_DIR${NC}"
    exit 1
fi

# Check if frontend directory exists
if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}❌ Error: Frontend directory not found at $FRONTEND_DIR${NC}"
    exit 1
fi

# Check if node_modules exist, if not, prompt to install
if [ ! -d "$BACKEND_DIR/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Backend dependencies not found. Installing...${NC}"
    cd "$BACKEND_DIR"
    npm install
fi

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Frontend dependencies not found. Installing...${NC}"
    cd "$FRONTEND_DIR"
    npm install
fi

# Check if .env file exists in backend
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo -e "${YELLOW}⚠️  Warning: Backend .env file not found${NC}"
    echo -e "${YELLOW}💡 Create $BACKEND_DIR/.env with database configuration${NC}"
fi

# Start backend server
echo -e "${BLUE}📦 Starting backend server...${NC}"
cd "$BACKEND_DIR"
npm run dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Check if backend started successfully
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Backend server failed to start${NC}"
    echo -e "${RED}Check logs: tail -f /tmp/backend.log${NC}"
    exit 1
fi

# Start frontend server
echo -e "${BLUE}🎨 Starting frontend server...${NC}"
cd "$FRONTEND_DIR"
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 2

# Check if frontend started successfully
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Frontend server failed to start${NC}"
    echo -e "${RED}Check logs: tail -f /tmp/frontend.log${NC}"
    cleanup
    exit 1
fi

echo -e "\n${GREEN}✅ Both servers are running!${NC}\n"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📡 Backend API:${NC}  http://localhost:5000"
echo -e "${GREEN}🌐 Frontend App:${NC} http://localhost:3000"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
echo -e "${YELLOW}💡 Press Ctrl+C to stop both servers${NC}\n"

# Show logs from both servers
tail -f /tmp/backend.log /tmp/frontend.log 2>/dev/null &
TAIL_PID=$!

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID

