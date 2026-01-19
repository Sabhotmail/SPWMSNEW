#!/bin/sh
set -e

echo "🚀 Starting SPWMS Application..."

# Wait for database to be ready
echo "⏳ Waiting for PostgreSQL..."
until nc -z -v -w30 postgres 5432 2>/dev/null; do
  echo "Waiting for database connection..."
  sleep 1
done
echo "✓ Database is ready!"

#  Run database migrations (run manually with: docker-compose exec app sh -c "npx prisma migrate deploy")
echo "⚠️  Run migrations manually: docker-compose exec app sh -c 'npx prisma migrate deploy'"

echo "✅ Application ready to start!"

# Execute the main command
exec "$@"
