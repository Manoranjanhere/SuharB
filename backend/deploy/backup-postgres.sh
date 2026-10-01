#!/usr/bin/env bash
# Daily backup of the local Postgres container. Keeps the last 7 days in backups/.
# If BACKUP_S3_BUCKET is set and the aws CLI is installed, also uploads to S3
# (an EC2 disk failure would otherwise lose both the database and its backups).
#
# Cron (daily 3:30 AM server time):
#   30 3 * * * cd /home/ubuntu/SuharB/backend && bash deploy/backup-postgres.sh >> backups/backup.log 2>&1
set -euo pipefail
cd "$(dirname "$0")/.."

mkdir -p backups
FILE="backups/sugarbf-$(date +%Y%m%d-%H%M%S).dump"

docker compose exec -T postgres sh -c \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc --no-owner --no-privileges' > "$FILE"
echo "$(date -Is) backup written: $FILE ($(du -h "$FILE" | cut -f1))"

find backups -name 'sugarbf-*.dump' -mtime +7 -delete

if [ -n "${BACKUP_S3_BUCKET:-}" ] && command -v aws >/dev/null 2>&1; then
  aws s3 cp "$FILE" "s3://$BACKUP_S3_BUCKET/db-backups/$(basename "$FILE")"
  echo "$(date -Is) uploaded to s3://$BACKUP_S3_BUCKET/db-backups/"
fi
