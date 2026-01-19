#!/bin/sh
set -e

echo "🚀 Starting SPWMS Application..."

# Wait for database to be ready
echo "⏳ Waiting for PostgreSQL..."
until nc -z postgres 5432 2>/dev/null; do
  echo "Waiting for database connection..."
  sleep 2
done
echo "✓ Database is ready!"

# Run database migrations automatically
echo "📦 Running database migrations..."
npx prisma migrate deploy && echo "✓ Migrations applied successfully!" || echo "⚠️ Migration skipped or already applied"

# Run database seeding (create default users if not exist)
echo "🌱 Seeding database..."
npx prisma db seed && echo "✓ Database seeded successfully!" || echo "⚠️ Seeding skipped or already done"

echo "✅ Application ready to start!"

# Execute the main command
exec "$@"
