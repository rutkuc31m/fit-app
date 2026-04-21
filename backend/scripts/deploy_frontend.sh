#!/bin/bash
# Build and deploy the fit frontend on the VM without deleting persistent GIF assets.
set -euo pipefail

APP_DIR="${APP_DIR:-/tmp/fit-app-deploy}"
WEB_DIR="${WEB_DIR:-/var/www/fitapp}"

cd "$APP_DIR/frontend"
npm ci
npm run build

sudo mkdir -p "$WEB_DIR/gifs"
GIF_BACKUP="$(mktemp -d)"
if [ -d "$WEB_DIR/gifs" ]; then
  sudo cp -a "$WEB_DIR/gifs/." "$GIF_BACKUP/" 2>/dev/null || true
fi

sudo rsync -a --delete --exclude='/gifs/***' dist/ "$WEB_DIR/"
sudo mkdir -p "$WEB_DIR/gifs"
sudo cp -a "$GIF_BACKUP/." "$WEB_DIR/gifs/" 2>/dev/null || true
rm -rf "$GIF_BACKUP"

sudo bash "$APP_DIR/backend/scripts/download_gifs.sh"
sudo test -s "$WEB_DIR/gifs/bp.gif"
sudo chown -R caddy:caddy "$WEB_DIR"
curl -fsSI --max-time 8 "https://fit.rutkuc.com/gifs/bp.gif" | grep -Ei 'HTTP/|content-type: image/gif'
