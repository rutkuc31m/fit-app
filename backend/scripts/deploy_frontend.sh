#!/bin/bash
# Build and deploy the fit frontend on the VM without deleting persistent GIF assets.
set -euo pipefail

APP_DIR="${APP_DIR:-/tmp/fit-app-deploy}"
WEB_DIR="${WEB_DIR:-/var/www/fitapp}"

cd "$APP_DIR/frontend"
npm ci
npm run build

sudo mkdir -p "$WEB_DIR/gifs"
sudo rsync -a --delete --filter='P /gifs/***' dist/ "$WEB_DIR/"
sudo bash "$APP_DIR/backend/scripts/download_gifs.sh"
sudo test -s "$WEB_DIR/gifs/bp.gif"
sudo chown -R caddy:caddy "$WEB_DIR"
