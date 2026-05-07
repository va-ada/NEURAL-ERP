#!/bin/bash
# Neural ERP — Database Backup Script
# Usage: ./scripts/backup.sh
# Schedule with cron: 0 2 * * * /path/to/backup.sh

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/neural_erp_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "Starting backup at $(date)..."

# Use DATABASE_URL or defaults
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-neural_erp}"
DB_USER="${DB_USER:-neural_admin}"

PGPASSWORD="${DB_PASSWORD:-neural_secret_2026}" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --no-owner \
    --no-acl \
    | gzip > "$BACKUP_FILE"

echo "Backup saved to: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

# Keep only last 30 backups
ls -t "${BACKUP_DIR}"/neural_erp_*.sql.gz 2>/dev/null | tail -n +31 | xargs -r rm --
echo "Cleanup done. $(ls "${BACKUP_DIR}"/neural_erp_*.sql.gz 2>/dev/null | wc -l) backups retained."
