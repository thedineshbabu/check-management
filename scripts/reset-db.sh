#!/bin/bash

# Database Reset Script
# WARNING: This will delete all data in the database
# Use with caution in development only

set -e

echo "⚠️  WARNING: This will delete all data in the database!"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Operation cancelled"
    exit 0
fi

echo "🔄 Resetting database..."

# Stop and remove container
docker-compose down -v

# Start fresh container
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Run initialization script
./scripts/init-db.sh

echo "✅ Database reset complete!"

