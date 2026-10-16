#!/usr/bin/env bash
set -euo pipefail

DB_HOST="${DB_HOST:-aws-0-eu-west-1.pooler.supabase.com}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres.arwshzfiiqfayzwvmyke}"
DB_NAME="${DB_NAME:-postgres}"

# Check for PGPASSWORD or parse from DATABASE_URL
if [ -z "${PGPASSWORD:-}" ] && [ -n "${DATABASE_URL:-}" ]; then
  # Extract password from postgresql://user:password@host:port/db
  export PGPASSWORD=$(echo "$DATABASE_URL" | sed -n 's/.*:\(.*\)@.*/\1/p' | cut -d: -f2)
fi

if [ -z "${PGPASSWORD:-}" ]; then
  echo "Error: PGPASSWORD or DATABASE_URL must be provided." >&2
  exit 1
fi

MIGRATIONS_DIR="supabase/migrations"

echo "=== Applying All Migrations to Supabase Staging Database ==="
echo "Host: $DB_HOST (Region: eu-west-1, Project: arwshzfiiqfayzwvmyke)"

for file in $(ls -1 "$MIGRATIONS_DIR"/*.sql | sort); do
  echo "--> Running migration: $(basename "$file")..."
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -f "$file"
  echo "    ✓ Applied $(basename "$file")"
done

echo ""
echo "--> Applying initial seed data (seed.sql)..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -f "supabase/seed.sql"
echo "    ✓ Applied seed.sql"

echo "=== All migrations and seed applied successfully! ==="
