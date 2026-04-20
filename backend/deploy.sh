#!/bin/bash
# fit-api — Deploy to Oracle VM
# Run ON the VM: sudo bash deploy.sh
set -e

echo "=== fit-api setup ==="

# 1. Node (reuse existing if present)
if ! command -v node &> /dev/null; then
  echo "[1/5] Installing Node 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

# 2. App dir
echo "[2/5] Setting up /opt/fitapi..."
mkdir -p /opt/fitapi
cp -r server.js db.js auth.js routes jobs scripts push_worker.js quotes.js package.json package-lock.json /opt/fitapi/
cd /opt/fitapi
npm install --omit=dev

# 3. Caddy (assumed installed by pollen deploy)
echo "[3/5] Merging Caddyfile block..."
if ! grep -q "api.fit.rutkuc.com" /etc/caddy/Caddyfile; then
  cat Caddyfile >> /etc/caddy/Caddyfile
  systemctl reload caddy
fi

# 4. systemd
echo "[4/5] systemd unit..."
cat > /etc/systemd/system/fitapi.service << 'UNIT'
[Unit]
Description=fit.rutkuc.com API
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/fitapi
Environment=FIT_DB=/opt/fitapi/data/fit.db
Environment=CORS_ORIGINS=https://fit.rutkuc.com
Environment=PORT=8001
Environment=FIT_VAPID_SUBJECT=mailto:admin@rutkuc.com
# Secrets must be set on the VM, not committed. This file can define:
# JWT_SECRET, FIT_VAPID_PUBLIC, FIT_VAPID_PRIVATE, ANTHROPIC_API_KEY, GEMINI_API_KEY.
EnvironmentFile=-/etc/fitapi/fitapi.env
ExecStart=/usr/bin/node /opt/fitapi/server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT

chown -R ubuntu:ubuntu /opt/fitapi
systemctl daemon-reload
systemctl enable fitapi
systemctl restart fitapi

# 5. Frontend dir
echo "[5/5] Frontend dir..."
mkdir -p /var/www/fitapp
chown -R caddy:caddy /var/www/fitapp

echo ""
echo "=== Done ==="
echo "API: https://api.fit.rutkuc.com/api/health"
echo "Frontend: copy frontend/dist/* to /var/www/fitapp/"
echo "Logs: journalctl -u fitapi -f"
