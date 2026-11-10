#!/usr/bin/env bash
set -euo pipefail

cd /opt/cloudnative
BACKUP_DIR="/tmp/cloudnative-backups"
TIMESTAMP=$(date -u +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="cloudnative_${TIMESTAMP}.sql.gz"
BUCKET_NAME="cloudnative-db-backups-802814881052-ap-south-1"

mkdir -p "$BACKUP_DIR"
echo "Starting PostgreSQL backup..."

docker compose exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' \
  | gzip > "$BACKUP_DIR/$BACKUP_FILE"

test -s "$BACKUP_DIR/$BACKUP_FILE"

aws s3 cp \
  "$BACKUP_DIR/$BACKUP_FILE" \
  "s3://${BUCKET_NAME}/postgres/$BACKUP_FILE" \
  --region ap-south-1 \
  --sse AES256

rm -f "$BACKUP_DIR/$BACKUP_FILE"
echo "Backup uploaded successfully: $BACKUP_FILE"
