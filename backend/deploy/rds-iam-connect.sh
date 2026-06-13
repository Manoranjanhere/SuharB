#!/bin/bash
# Connect to Aurora with IAM auth (from a machine with AWS CLI + psql).
# For the NestJS API, use password auth in .env (DB_PASSWORD) unless you add IAM plugin support.

set -euo pipefail

export AWS_REGION="${AWS_REGION:-ap-south-1}"
export RDSHOST="database-1.cluster-chsuw4a8mjnh.ap-south-1.rds.amazonaws.com"
export RDSHOST_RO="database-1.cluster-ro-chsuw4a8mjnh.ap-south-1.rds.amazonaws.com"
export PGPORT=5432
export PGUSER="${PGUSER:-postgres}"
export PGDATABASE="${PGDATABASE:-postgres}"

TOKEN=$(aws rds generate-db-auth-token \
  --hostname "$RDSHOST" \
  --port "$PGPORT" \
  --username "$PGUSER" \
  --region "$AWS_REGION")

psql "host=$RDSHOST port=$PGPORT dbname=$PGDATABASE user=$PGUSER sslmode=require password=$TOKEN"
