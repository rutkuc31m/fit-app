#!/bin/bash
# Quick production smoke check for the fit app VM.
set -euo pipefail

API_BASE="${API_BASE:-http://127.0.0.1:8001/api}"
WEB_BASE="${WEB_BASE:-https://fit.rutkuc.com}"

echo "=== services ==="
systemctl is-active --quiet fitapi
systemctl is-active --quiet caddy
echo "fitapi: active"
echo "caddy: active"

echo ""
echo "=== api ==="
curl -fsS --max-time 8 "$API_BASE/health"
echo ""

echo ""
echo "=== frontend assets ==="
asset="$(find /var/www/fitapp/assets -maxdepth 1 -name 'index-*.js' -type f | sort | tail -1)"
test -n "$asset"
asset_name="$(basename "$asset")"
curl -fsSI --max-time 8 "$WEB_BASE/assets/$asset_name" | grep -Ei 'HTTP/|content-type: text/javascript'

echo ""
echo "=== gifs ==="
test -s /var/www/fitapp/gifs/bp.gif
curl -fsSI --max-time 8 "$WEB_BASE/gifs/bp.gif" | grep -Ei 'HTTP/|content-type: image/gif'

echo ""
echo "ok"
