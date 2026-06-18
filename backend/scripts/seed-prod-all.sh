#!/usr/bin/env bash
# Run ON THE EC2 INSTANCE (inside VPC — RDS is not reachable from your laptop).
#
#   cd ~/SuharB/backend   # or your deploy path
#   bash scripts/seed-prod-all.sh 20 20
#
# Args: [rourkela_count] [noida_count]  (default 20 each)

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ROURKELA_COUNT="${1:-20}"
NOIDA_COUNT="${2:-20}"

if [[ ! -f .env.production ]]; then
  echo "Missing .env.production in $ROOT"
  exit 1
fi

echo "=== Seeding production DB (via EC2) ==="
echo "Rourkela: $ROURKELA_COUNT users"
node scripts/seed-rourkela-users.js --prod --confirm-prod "$ROURKELA_COUNT"

echo ""
echo "Noida: $NOIDA_COUNT users"
node scripts/seed-test-users.js --prod --confirm-prod "$NOIDA_COUNT"

echo ""
echo "Done."
