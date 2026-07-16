#!/bin/bash
#
# Backup otomatis database KawalTransaksi.
# - Dump database Postgres dari container Docker
# - Compress jadi .sql.gz
# - Simpan lokal di ~/kawaltransaksi/backups/
# - Upload ke Cloudflare R2 (bucket kawaltransaksi-backups)
# - Hapus backup lokal & remote yang lebih tua dari RETENTION_DAYS
#
# Dijadwalkan lewat cron, jalan otomatis tiap hari jam 2 pagi WIB.
# Log tiap eksekusi ditulis ke ~/kawaltransaksi/backups/backup.log

set -euo pipefail

# ── Konfigurasi ──────────────────────────────────────────────────────────
PROJECT_DIR="/root/kawaltransaksi"
BACKUP_DIR="$PROJECT_DIR/backups"
RETENTION_DAYS=7
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
FILENAME="kawaltransaksi-db-${TIMESTAMP}.sql.gz"
LOCAL_PATH="$BACKUP_DIR/$FILENAME"
LOG_FILE="$BACKUP_DIR/backup.log"

R2_ENV_FILE="$PROJECT_DIR/.env.backup"

# ── Setup ────────────────────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"
exec >> "$LOG_FILE" 2>&1

echo ""
echo "=== Backup dimulai: $(date '+%Y-%m-%d %H:%M:%S') ==="

if [ ! -f "$R2_ENV_FILE" ]; then
  echo "[ERROR] File $R2_ENV_FILE tidak ditemukan. Backup dibatalkan."
  exit 1
fi
source "$R2_ENV_FILE"

# ── 1. Dump database dari container Postgres ────────────────────────────
echo "Dumping database..."
docker exec kawaltransaksi-postgres-1 pg_dump -U kawaltransaksi kawaltransaksi | gzip > "$LOCAL_PATH"

if [ ! -s "$LOCAL_PATH" ]; then
  echo "[ERROR] File backup kosong atau gagal dibuat. Backup dibatalkan."
  rm -f "$LOCAL_PATH"
  exit 1
fi

SIZE=$(du -h "$LOCAL_PATH" | cut -f1)
echo "Backup lokal berhasil: $LOCAL_PATH ($SIZE)"

# ── 2. Upload ke Cloudflare R2 lewat AWS CLI (S3-compatible) ────────────
echo "Uploading ke R2..."
AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
aws s3 cp "$LOCAL_PATH" "s3://$R2_BUCKET_NAME/$FILENAME" \
  --endpoint-url "$R2_ENDPOINT" \
  --region auto

echo "Upload ke R2 berhasil: $R2_BUCKET_NAME/$FILENAME"

# ── 3. Retensi — hapus backup lokal yang lebih tua dari RETENTION_DAYS ──
echo "Menghapus backup lokal lebih tua dari $RETENTION_DAYS hari..."
find "$BACKUP_DIR" -name "kawaltransaksi-db-*.sql.gz" -mtime +"$RETENTION_DAYS" -print -delete

# ── 4. Retensi — hapus backup di R2 yang lebih tua dari RETENTION_DAYS ──
echo "Menghapus backup R2 lebih tua dari $RETENTION_DAYS hari..."
CUTOFF_DATE=$(date -d "-$RETENTION_DAYS days" +%Y-%m-%d)

AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
aws s3api list-objects-v2 \
  --bucket "$R2_BUCKET_NAME" \
  --endpoint-url "$R2_ENDPOINT" \
  --region auto \
  --query "Contents[?LastModified<='${CUTOFF_DATE}'].Key" \
  --output text | tr '\t' '\n' | while read -r key; do
    if [ -n "$key" ] && [ "$key" != "None" ]; then
      echo "  Menghapus dari R2: $key"
      AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
      AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
      aws s3 rm "s3://$R2_BUCKET_NAME/$key" --endpoint-url "$R2_ENDPOINT" --region auto
    fi
  done

echo "=== Backup selesai: $(date '+%Y-%m-%d %H:%M:%S') ==="
