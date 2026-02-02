# Quick Setup Guide

## Docker PostgreSQL Setup

This guide will help you set up PostgreSQL using Docker Desktop for local development.

### Step 1: Start PostgreSQL Container

Open a terminal in the project root and run:

```bash
docker-compose up -d
```

This command will:
- Download PostgreSQL 15 Alpine image (if not already present)
- Create a container named `check-management-postgres`
- Start PostgreSQL on port 5432
- Create a persistent volume for database data
- Automatically create the `check_management` database

### Step 2: Initialize Database Schema

After the container is running, initialize the database tables:

**Windows (PowerShell):**
```powershell
.\scripts\init-db.ps1
```

**Linux/Mac:**
```bash
chmod +x scripts/init-db.sh
./scripts/init-db.sh
```

This will create the following tables:
- `users` - User authentication
- `bank_accounts` - Bank account information
- `checks` - Check transactions

### Step 3: Configure Backend Environment

1. Navigate to the `backend` directory
2. Create a `.env` file with the following content:

```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=check_management
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-secret-key-change-in-production-use-a-strong-random-string
JWT_EXPIRES_IN=7d
```

**Important:** Change `JWT_SECRET` to a strong random string for security.

### Step 4: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 5: Start Backend Server

```bash
npm run dev
```

The backend should now connect to the PostgreSQL database running in Docker.

## Useful Docker Commands

### Check Container Status
```bash
docker ps
```

### View PostgreSQL Logs
```bash
docker-compose logs -f postgres
```

### Access PostgreSQL CLI
```bash
docker exec -it check-management-postgres psql -U postgres -d check_management
```

### Stop PostgreSQL Container
```bash
docker-compose down
```

### Stop and Remove All Data (Reset)
```bash
docker-compose down -v
```

Then restart and reinitialize:
```bash
docker-compose up -d
# Wait a few seconds, then:
.\scripts\init-db.ps1  # Windows
# or
./scripts/init-db.sh   # Linux/Mac
```

## Troubleshooting

### Container won't start
- Make sure Docker Desktop is running
- Check if port 5432 is already in use: `netstat -an | findstr 5432` (Windows) or `lsof -i :5432` (Linux/Mac)
- View logs: `docker-compose logs postgres`

### Connection refused errors
- Verify container is running: `docker ps`
- Check if PostgreSQL is ready: `docker exec check-management-postgres pg_isready -U postgres`
- Wait a few seconds after starting the container before running migrations

### Migration errors
- Ensure container is fully started (wait 5-10 seconds after `docker-compose up -d`)
- Check database exists: `docker exec check-management-postgres psql -U postgres -l`
- Verify migration file exists: `ls database/migrations/001_initial_schema.sql`

## Database Credentials

Default credentials (matching docker-compose.yml):
- **Host:** localhost
- **Port:** 5432
- **Database:** check_management
- **User:** postgres
- **Password:** postgres

**Note:** These are development defaults. Change them in production!

