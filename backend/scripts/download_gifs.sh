#!/bin/bash
# Download exercise preview GIFs.
# Source: ExerciseDB (static.exercisedb.dev) — free, no auth required
#
# Run ON the VM:
#   sudo bash /opt/fitapi/scripts/download_gifs.sh
#
# Optional:
#   sudo DEST=/var/www/fitapp-gifs bash /opt/fitapi/scripts/download_gifs.sh
#
# Or run from local machine via SSH:
#   ssh -i ~/.ssh/fit_key ubuntu@92.5.70.160 "sudo bash /opt/fitapi/scripts/download_gifs.sh"

set -e

DEST="${DEST:-/var/www/fitapp/gifs}"
CDN="https://static.exercisedb.dev/media"

echo "=== Fit-App GIF Download ==="
mkdir -p "$DEST"

# Map: filename -> CDN hash
declare -A GIFS=(
  # Upper body — Day A
  ["bp.gif"]="EIeI8Vf"                  # Bench Press
  ["dr.gif"]="C0MA9bC"                  # Dumbbell One-Arm Row
  ["seated_shoulder_press.gif"]="kTbSH9h" # Seated Overhead Press
  ["lp.gif"]="qdRxqCj"                  # Cable Lat Pulldown
  ["fp.gif"]="yUdIGNs"                  # Cable Rear Delt Row (Face Pull)
  ["bc.gif"]="3s4NnTh"                  # Dumbbell Biceps Curl
  ["tp.gif"]="3ZflifB"                  # Cable Triceps Pushdown

  # Lower body — Day B
  ["leg_press.gif"]="2Qh2J1e"           # Sled 45° Leg Press
  ["seated_leg_curl.gif"]="17lJ1kr"     # Lever Lying Leg Curl
  ["lc.gif"]="17lJ1kr"                  # Leg Curl
  ["le.gif"]="my33uHU"                  # Lever Leg Extension
  ["cr.gif"]="8ozhUIZ"                  # Standing Calf Raise

  # Core & rehab (Phase 1)
  ["pl.gif"]="VBAWRPG"                  # Front Plank
  ["db.gif"]="iny3m5y"                  # Dead Bug
  ["bd.gif"]="qBcKorM"                  # Bird Dog (all-fours extension)
  ["gb.gif"]="qKBpF7I"                  # Barbell Glute Bridge

  # Full body — Day C
  ["hip_thrust.gif"]="GibBPPg"          # Hip Thrust / Glute Bridge March
  ["ip.gif"]="8eqjhOl"                  # Incline Dumbbell Press
  ["cw.gif"]="fUBheHs"                  # Cable Seated Row
  ["gs.gif"]="yn8yg1r"                  # Dumbbell Goblet Squat
  ["lr.gif"]="dRTfGZT"                  # Lateral Raise
)

ok=0
fail=0

for filename in "${!GIFS[@]}"; do
  hash="${GIFS[$filename]}"
  url="${CDN}/${hash}.gif"
  dest_file="${DEST}/${filename}"

  if [ -f "$dest_file" ] && [ -s "$dest_file" ]; then
    echo "  [skip] $filename (already exists)"
    ((ok+=1))
    continue
  fi

  echo -n "  [dl]   $filename ... "
  if curl -fsSL --max-time 30 "$url" -o "$dest_file"; then
    size=$(du -sh "$dest_file" | cut -f1)
    echo "ok ($size)"
    ((ok+=1))
  else
    echo "FAIL (url: $url)"
    rm -f "$dest_file"
    ((fail+=1))
  fi
done

echo ""
echo "=== Done: $ok ok, $fail failed ==="
echo "GIF directory: $DEST"
ls -lh "$DEST"/*.gif 2>/dev/null | awk '{print "  "$5, $9}'

# Fix ownership so Caddy can serve them
chown -R caddy:caddy "$DEST" 2>/dev/null || chown -R www-data:www-data "$DEST" 2>/dev/null || true
chmod 644 "$DEST"/*.gif 2>/dev/null || true

echo ""
echo "Serve test (first GIF):"
curl -sI "https://fit.rutkuc.com/gifs/bp.gif" | grep -E "HTTP|content-type|content-length" || true
