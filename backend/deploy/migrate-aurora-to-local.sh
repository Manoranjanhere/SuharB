#!/usr/bin/env bash
# Copies all data from Aurora into the local Postgres container.
#
# Run from backend/ AFTER .env has been switched to DB_HOST=postgres:
#   AURORA_HOST=database-1.cluster-xxxx.ap-south-1.rds.amazonaws.com \
#   AURORA_PASSWORD='old-aurora-password' \
#   bash deploy/migrate-aurora-to-local.sh
#
# Optional: AURORA_USER (default postgres), AURORA_DB (default postgres),
#           POSTGRES_VERSION (default 16; must be >= Aurora's major version).
set -euo pipefail
cd "$(dirname "$0")/.."

: "${AURORA_HOST:?Set AURORA_HOST to the Aurora writer endpoint}"
: "${AURORA_PASSWORD:?Set AURORA_PASSWORD to the Aurora master password}"
AURORA_USER="${AURORA_USER:-postgres}"
AURORA_DB="${AURORA_DB:-postgres}"
PG_IMAGE="postgres:${POSTGRES_VERSION:-16}-alpine"

mkdir -p backups
DUMP="backups/aurora-$(date +%Y%m%d-%H%M%S).dump"

aurora() {
  docker run --rm -v "$PWD/backups:/backups" \
    -e PGPASSWORD="$AURORA_PASSWORD" -e PGSSLMODE=require \
    "$PG_IMAGE" "$@" -h "$AURORA_HOST" -U "$AURORA_USER" -d "$AURORA_DB"
}

local_psql() {
  docker compose exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" "$@"' -- "$@"
}

echo "==> Stopping API so no new writes hit Aurora during the copy"
docker compose stop api || true

echo "==> Aurora version"
aurora psql -tAc "select version();"

echo "==> Dumping Aurora to $DUMP"
aurora pg_dump -Fc --no-owner --no-privileges -f "/$DUMP"
ls -lh "$DUMP"

echo "==> Starting local Postgres"
docker compose up -d postgres
until docker compose exec -T postgres sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"' >/dev/null 2>&1; do
  sleep 2
done

echo "==> Restoring into local Postgres"
docker compose exec -T postgres sh -c \
  'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-privileges --clean --if-exists' \
  < "$DUMP" || echo "!! pg_restore reported warnings (often harmless RDS-only objects) — check counts below"

echo "==> Row counts (Aurora vs local)"
for table in users user_photos likes messages subscriptions coin_transactions migrations; do
  remote=$(aurora psql -tAc "select count(*) from \"$table\";" 2>/dev/null || echo "n/a")
  localc=$(local_psql -tAc "select count(*) from \"$table\";" 2>/dev/null || echo "n/a")
  printf '  %-20s aurora=%-8s local=%s\n' "$table" "$remote" "$localc"
done

echo "==> Starting API on local Postgres"
docker compose up -d --build api
echo "Done. Check: docker compose logs --tail 50 api"
