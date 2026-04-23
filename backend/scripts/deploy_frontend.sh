#!/bin/bash
# Build and deploy the fit frontend on the VM without deleting persistent GIF assets.
set -euo pipefail

APP_DIR="${APP_DIR:-/tmp/fit-app-deploy}"
WEB_DIR="${WEB_DIR:-/var/www/fitapp}"
GIF_DIR="${GIF_DIR:-/var/www/fitapp-gifs}"

cd "$APP_DIR/frontend"
npm ci
npm run build

sudo mkdir -p "$WEB_DIR" "$GIF_DIR"
if [ -d "$WEB_DIR/gifs" ] && [ ! -L "$WEB_DIR/gifs" ]; then
  sudo cp -a "$WEB_DIR/gifs/." "$GIF_DIR/" 2>/dev/null || true
fi

sudo rsync -a --delete \
  --filter='P /gifs' \
  --filter='P /gifs/***' \
  dist/ "$WEB_DIR/"

sudo DEST="$GIF_DIR" bash "$APP_DIR/backend/scripts/download_gifs.sh"
sudo test -s "$GIF_DIR/bp.gif"
sudo rm -rf "$WEB_DIR/gifs"
sudo mkdir -p "$WEB_DIR/gifs"
sudo cp -a "$GIF_DIR/." "$WEB_DIR/gifs/"
sudo chown -R caddy:caddy "$WEB_DIR" "$GIF_DIR"
sudo test -s "$WEB_DIR/gifs/bp.gif"
curl -fsSI --max-time 8 "https://fit.rutkuc.com/gifs/bp.gif" | grep -Ei 'HTTP/|content-type: image/gif'
