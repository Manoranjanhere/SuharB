#!/usr/bin/env bash
# Seed production RDS via the API Docker container (EC2 has no Node on host).
#
# On EC2:
#   cd ~/SuharB/backend
#   git pull
#   docker compose up -d --build
#   bash scripts/seed-via-docker.sh 20 20
#
# Args: [rourkela_count] [noida_count]

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ROURKELA="${1:-20}"
NOIDA="${2:-20}"

if [[ ! -f .env ]]; then
  echo "Missing backend/.env — create it on EC2 (see deploy/README.md):"
  echo "  cp .env.production.example .env"
  echo "  nano .env   # set DB_HOST, DB_PASSWORD, etc."
  exit 1
fi

if ! docker compose ps --status running 2>/dev/null | grep -q api; then
  echo "Starting API container..."
  docker compose up -d --build
fi

run_seed() {
  docker compose exec -T api node "$@"
}

echo "=== Rourkela: $ROURKELA users ==="
run_seed scripts/seed-rourkela-users.js --prod --confirm-prod "$ROURKELA"

echo ""
echo "=== Noida: $NOIDA users ==="
run_seed scripts/seed-test-users.js --prod --confirm-prod "$NOIDA"

echo ""
echo "Done."
