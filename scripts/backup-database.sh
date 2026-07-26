#!/bin/bash
#
# Backup otomatis database KawalTransaksi.
# - Dump database Postgres dari container Docker
# - Compress jadi .sql.gz
# - Simpan di /backup (Free Disk NFS dari Jagoan Hosting, TIDAK memakai disk utama VPS)
# - Upload ke Cloudflare R2 (bucket kawaltransaksi-backups)
# - Hapus backup NFS & remote yang lebih tua dari RETENTION_DAYS
#
# Dijadwalkan lewat cron, jalan otomatis tiap hari jam 2 pagi WIB.
# Log tiap eksekusi ditulis ke $BACKUP_DIR/backup.log
#
# PENTING: /backup harus sudah di-mount (lihat /etc/fstab) sebelum script ini
# jalan. Jika mount tidak aktif, script BERHENTI dan tidak menulis apapun ke
# disk utama VPS sebagai fallback -- ini disengaja, agar disk utama tetap
# bersih dari backup dan kegagalan mount langsung terlihat di log/notifikasi
# cron, bukan diam-diam menulis ke lokasi yang salah.

set -euo pipefail

# ── Konfigurasi ──────────────────────────────────────────────────────────
PROJECT_DIR="/root/kawaltransaksi"
BACKUP_DIR="/backup"
RETENTION_DAYS=7
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
FILENAME="kawaltransaksi-db-${TIMESTAMP}.sql.gz"
LOCAL_PATH="$BACKUP_DIR/$FILENAME"
LOG_FILE="$BACKUP_DIR/backup.log"

R2_ENV_FILE="$PROJECT_DIR/.env.backup"

# ── Setup ────────────────────────────────────────────────────────────────

# Guard wajib: pastikan /backup benar-benar mount point NFS aktif, bukan
# sekadar folder kosong di disk utama (misal karena NFS sempat terputus).
# Jika mount tidak aktif, hentikan sebelum sempat menulis apapun.
if ! mountpoint -q "$BACKUP_DIR"; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] $BACKUP_DIR bukan mount point aktif. Backup dibatalkan agar tidak menulis ke disk utama VPS." \
    | tee -a /root/kawaltransaksi/backup-mount-error.log
  exit 1
fi

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
echo "Backup NFS berhasil: $LOCAL_PATH ($SIZE)"

# ── 2. Upload ke Cloudflare R2 lewat AWS CLI (S3-compatible) ────────────
echo "Uploading ke R2..."
AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
aws s3 cp "$LOCAL_PATH" "s3://$R2_BUCKET_NAME/$FILENAME" \
  --endpoint-url "$R2_ENDPOINT" \
  --region auto

echo "Upload ke R2 berhasil: $R2_BUCKET_NAME/$FILENAME"

# ── 3. Retensi — hapus backup di NFS yang lebih tua dari RETENTION_DAYS ─
echo "Menghapus backup NFS lebih tua dari $RETENTION_DAYS hari..."
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