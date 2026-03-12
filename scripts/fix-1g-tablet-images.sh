#!/bin/bash
# Fix ALL ABC Gold Minted Tablet images: convert JPG (white bg) -> PNG (transparent bg)
# Then upload to Supabase storage and update DB paths
#
# Prerequisites:
#   brew install imagemagick
#   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (or sourced from .env)
#
# Usage: ./scripts/fix-1g-tablet-images.sh

set -euo pipefail

# --- Config ---
BUCKET="Images"
SUPABASE_URL="${SUPABASE_URL:-https://vlvejjyyvzrepccgmsvo.supabase.co}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:?Set SUPABASE_SERVICE_ROLE_KEY}"

BASE_DIR="public/ABC_Bullion_Photos/Gold_Minted_Tablets"
OUT_DIR="/tmp/abc_minted_tablets_png"

# All ABC minted tablet folders with JPGs (5g already has PNGs)
FOLDERS=(
  "1g_ABC_Gold_Minted_Tablet_9999"
  "10g_ABC_Gold_Minted_Tablet_9999"
  "20g_ABC_Gold_Minted_Tablet_9999"
  "1oz_ABC_Gold_Minted_Tablet_9999"
  "100g_ABC_Gold_Minted_Tablet_9999"
  "20x1g_CombiBar_Gold_Minted_9999"
)

# --- Step 1: Convert JPGs to PNGs with transparent background ---
echo "=== Converting JPGs to PNGs (removing white background) ==="
TOTAL=0
for folder in "${FOLDERS[@]}"; do
  src="$BASE_DIR/$folder"
  out="$OUT_DIR/$folder"
  mkdir -p "$out"

  for jpg in "$src"/*.jpg; do
    [ -f "$jpg" ] || continue
    base=$(basename "$jpg" .jpg)
    png="$out/${base}.png"
    echo "  $folder/$base.jpg -> .png"
    if magick "$jpg" -fuzz 15% -transparent white "$png" 2>/dev/null; then
      ((TOTAL++))
    else
      echo "    WARNING: Failed to convert $base.jpg (corrupt/truncated?) — skipping"
      rm -f "$png"
    fi
  done
done

echo ""
echo "=== Converted $TOTAL files ==="
echo "Output: $OUT_DIR"
ls -R "$OUT_DIR" | head -40

echo ""
read -p "Inspect the PNGs in $OUT_DIR. Continue with upload? (y/N) " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "Aborted."
  exit 0
fi

# --- Step 2: Upload PNGs to Supabase storage ---
echo ""
echo "=== Uploading PNGs to Supabase storage ==="
for folder in "${FOLDERS[@]}"; do
  out="$OUT_DIR/$folder"
  storage_prefix="ABC_Bullion_Photos/Gold_Minted_Tablets/$folder"

  for png in "$out"/*.png; do
    [ -f "$png" ] || continue
    filename=$(basename "$png")
    storage_path="$storage_prefix/$filename"
    echo "  $folder/$filename"

    curl -s -X POST \
      "${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storage_path}" \
      -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
      -H "Content-Type: image/png" \
      -H "x-upsert: true" \
      --data-binary "@${png}" \
      -o /dev/null -w "    HTTP %{http_code}\n"
  done
done

# --- Step 3: Update DB paths from .jpg to .png ---
echo ""
echo "=== Updating database paths ==="
echo ""
echo "Run this SQL in Supabase SQL Editor:"
echo ""

cat << 'EOSQL'
-- Update image_url and images for all ABC Gold Minted Tablets
UPDATE products
SET
  image_url = REPLACE(image_url, '.jpg', '.png'),
  images = REPLACE(images::text, '.jpg', '.png')::jsonb
WHERE brand = 'ABC Bullion'
  AND form_type = 'minted'
  AND category = 'Gold'
  AND image_url LIKE '%Gold_Minted_Tablets%'
  AND image_url LIKE '%.jpg';
EOSQL

echo ""
echo "=== Done ==="
echo "Converted PNGs are in: $OUT_DIR"
