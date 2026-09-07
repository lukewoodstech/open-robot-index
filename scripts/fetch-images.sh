#!/usr/bin/env bash
# Download hero images listed in a JSON manifest into public/robots/<slug>/hero.<ext>.
# Manifest: array of {slug, image_url, page_url, attribution}. Skips nulls.
# Verifies the download is an image and downsizes anything wider than 1600px (sips, macOS).
set -euo pipefail
MANIFEST="${1:?manifest.json}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
node -e '
const m=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));
for(const r of m){ if(r&&r.slug&&r.image_url) console.log(r.slug+"\t"+r.image_url); }
' "$MANIFEST" | while IFS=$'\t' read -r slug url; do
  dir="$ROOT/public/robots/$slug"; mkdir -p "$dir"
  tmp="$dir/download.bin"
  if ! curl -sL --max-time 60 -A "Mozilla/5.0 (Macintosh) OpenRobotIndex/1.0" -o "$tmp" "$url"; then
    echo "✗ $slug: download failed"; rm -f "$tmp"; continue
  fi
  mime=$(file -b --mime-type "$tmp")
  case "$mime" in
    image/jpeg) ext=jpg ;;
    image/png)  ext=png ;;
    image/webp) ext=webp ;;
    *) echo "✗ $slug: not an image ($mime)"; rm -f "$tmp"; continue ;;
  esac
  out="$dir/hero.$ext"; mv "$tmp" "$out"
  # Downsize large originals; keep aspect ratio.
  w=$(sips -g pixelWidth "$out" 2>/dev/null | awk '/pixelWidth/{print $2}')
  if [ "${w:-0}" -gt 1600 ]; then sips --resampleWidth 1600 "$out" >/dev/null 2>&1 || true; fi
  echo "✓ $slug: $out ($(du -h "$out" | cut -f1), ${w}px wide)"
done
