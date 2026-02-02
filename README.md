# Check Management Application

A modern full-stack application for managing cash and check transactions across multiple bank accounts. Built with React, Node.js, and PostgreSQL.

## Features

- **User Authentication**: Secure login with JWT tokens
- **Multi-Account Management**: Manage multiple bank accounts with custom aliases
- **Check Tracking**: Track incoming and outgoing checks with dates and amounts
- **Calendar Dashboard**: Visual calendar view showing checks and balances by date
- **Balance Tracking**: Real-time balance calculations per account and overall
- **Low Balance Warnings**: Configurable thresholds with visual warnings
- **Modern UI**: Futuristic, responsive design with smooth animations

## Tech Stack

### Backend
- Node.js with Express.js
- PostgreSQL database
- JWT authentication
- Winston logging
- bcrypt for password hashing

### Frontend
- React 18 with hooks
- React Router for navigation
- Axios for API calls
- date-fns for date manipulation
- Modern CSS with CSS variables

## Project Structure

```
check-management/
├── backend/           # Node.js backend API
│   ├── src/
│   │   ├── config/   # Database and logger configuration
│   │   ├── controllers/  # Business logic
│   │   ├── middleware/   # Auth middleware
│   │   ├── models/      # Database models
│   │   ├── routes/      # API routes
│   │   └── utils/       # Utility functions
│   └── package.json
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── context/     # React context (Auth)
│   │   ├── services/    # API service layer
│   │   └── utils/       # Utility functions
│   └── package.json
├── database/          # Database migrations
│   └── migrations/
├── scripts/           # Setup and startup scripts
│   ├── init-db.sh     # Initialize database (Linux/Mac)
│   ├── init-db.ps1    # Initialize database (Windows)
│   ├── reset-db.sh    # Reset database (Linux/Mac)
│   ├── reset-db.ps1   # Reset database (Windows)
│   ├── start-dev.sh  # Start both servers (Linux/Mac)
│   ├── start-dev.ps1  # Start both servers (Windows)
│   ├── start-backend.sh  # Start backend only (Linux/Mac)
│   ├── start-backend.ps1 # Start backend only (Windows)
│   ├── start-frontend.sh # Start frontend only (Linux/Mac)
│   └── start-frontend.ps1 # Start frontend only (Windows)
├── docker-compose.yml # Docker configuration for PostgreSQL
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- Docker Desktop (for PostgreSQL)
- npm or yarn

### Database Setup with Docker

1. **Start PostgreSQL container:**
```bash
docker-compose up -d
```

This will:
- Create a PostgreSQL 15 container named `check-management-postgres`
- Expose PostgreSQL on port `5432`
- Create a persistent volume for database data
- Set up the database `check_management` automatically

2. **Initialize database schema:**

**On Linux/Mac:**
```bash
chmod +x scripts/init-db.sh
./scripts/init-db.sh
```

**On Windows (PowerShell):**
```powershell
.\scripts\init-db.ps1
```

This will run the migration script to create all necessary tables.

3. **Verify PostgreSQL is running:**
```bash
docker ps
```

You should see `check-management-postgres` container running.

4. **Optional: Reset database (WARNING: deletes all data):**

**On Linux/Mac:**
```bash
./scripts/reset-db.sh
```

**On Windows (PowerShell):**
```powershell
.\scripts\reset-db.ps1
```

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file in the `backend` directory:
```bash
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

**Note:** The database credentials match the Docker setup. Change `JWT_SECRET` to a strong random string in production.

4. Start the backend server:
```bash
npm start
# or for development with auto-reload
npm run dev
```

The backend API will be running on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (optional, defaults to proxy):
```bash
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will be running on `http://localhost:3000`

### Quick Start Scripts

For convenience, use these scripts to start both servers at once:

**Start Both Servers (Recommended):**

**On Linux/Mac:**
```bash
chmod +x scripts/*.sh  # Make scripts executable (first time only)
./scripts/start-dev.sh
```

**On Windows (PowerShell):**
```powershell
.\scripts\start-dev.ps1
```

This will:
- Check and install dependencies if needed
- Start backend server on `http://localhost:5000`
- Start frontend server on `http://localhost:3000`
- Display logs from both servers
- Stop both servers when you press Ctrl+C

**Start Individual Servers:**

**Backend only:**
```bash
# Linux/Mac
./scripts/start-backend.sh

# Windows
.\scripts\start-backend.ps1
```

**Frontend only:**
```bash
# Linux/Mac
./scripts/start-frontend.sh

# Windows
.\scripts\start-frontend.ps1
```

### Docker Commands Reference

- **Start PostgreSQL:** `docker-compose up -d`
- **Stop PostgreSQL:** `docker-compose down`
- **View logs:** `docker-compose logs -f postgres`
- **Access PostgreSQL CLI:** `docker exec -it check-management-postgres psql -U postgres -d check_management`
- **Stop and remove all data:** `docker-compose down -v`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (optional, defaults to proxy):
```bash
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will be running on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Bank Accounts
- `GET /api/accounts` - Get all accounts
- `POST /api/accounts` - Create new account
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account

### Checks
- `GET /api/checks` - Get checks (with filters: date, accountId, type)
- `POST /api/checks` - Create new check
- `PUT /api/checks/:id` - Update check
- `DELETE /api/checks/:id` - Delete check

### Dashboard
- `GET /api/dashboard/balance?date=YYYY-MM-DD` - Get balance for date
- `GET /api/dashboard/checks?date=YYYY-MM-DD` - Get checks for date
- `GET /api/dashboard/summary?date=YYYY-MM-DD` - Get complete dashboard data

## Usage

1. **Register/Login**: Create an account or login with existing credentials
2. **Add Bank Accounts**: Add your bank accounts with account numbers and aliases
3. **Set Low Balance Thresholds**: Configure warning thresholds for each account
4. **Create Checks**: Add incoming or outgoing checks with dates and amounts
5. **View Dashboard**: Use the calendar to navigate dates and view balances
6. **Monitor Balances**: Track overall and per-account balances with warnings

## Development

### Backend Development
- Uses ES modules (type: "module")
- Winston logger for all operations
- JSDoc comments throughout
- Error handling and validation

### Frontend Development
- React functional components with hooks
- Context API for state management
- Responsive design with CSS variables
- Modern UI with smooth animations

## License

ISC

