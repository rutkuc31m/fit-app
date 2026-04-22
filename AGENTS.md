# Fit App Agent Notes

This repository is `rutkuc31m/fit-app`, a nutrition, fasting, training, and progress tracking PWA.

## Production Host

- Oracle VM user: `ubuntu`
- App domain: `https://fit.rutkuc.com`
- API domain: `https://api.fit.rutkuc.com`
- Backend service: `fitapi`
- Reverse proxy: `caddy`
- Production backend path: `/opt/fitapi`
- Production frontend path: `/var/www/fitapp`
- Do not use `/opt/fitapi` as the development workspace.

## Safe Workspace

Use `~/fit-app` as the working clone on the VM.

Before production changes:

1. Edit in `~/fit-app`.
2. Run syntax/build checks.
3. Commit and push to `main`.
4. Deploy from a fresh clone or the checked commit.
5. Run smoke checks.

## Common Checks

```bash
node --check backend/db.js
node --check backend/server.js
find backend/routes backend/jobs backend/lib -name '*.js' -print0 | xargs -0 -n1 node --check
cd frontend
npm ci
npm audit
npm run build
```

## Deploy Shape

Frontend deploy:

```bash
sudo bash backend/scripts/deploy_frontend.sh
```

Backend deploy:

```bash
sudo cp backend/db.js backend/server.js /opt/fitapi/
sudo cp -r backend/routes backend/jobs backend/scripts backend/lib /opt/fitapi/
sudo systemctl restart fitapi
sudo bash /opt/fitapi/scripts/smoke_check.sh
```

The smoke script may show brief `curl: connection refused` lines during restart. The final result must still show `fitapi: active`, `caddy: active`, API health OK, frontend assets OK, and `ok`.

## Current Product Decisions

- Step tracking UI was removed because iPhone Shortcut day aggregation was unreliable.
- iOS input zoom is prevented with viewport/focus handling.
- Pull-to-refresh exists and should stay smooth.
- Meals can be edited after adding.
- Exercise GIFs are served from `/gifs`.
- Fast days should not suggest extra training.
- Hydration tracks water and coffee separately, but total hydration is `water_ml + coffee_ml`.
- Recovery signal uses `energy`, `hunger`, and `headache` on `daily_logs`.
- Weekly review lives at `/api/stats/weekly-review`.

## Operating Style

- Keep changes small, testable, and deployable.
- Preserve the current visual language unless explicitly redesigning.
- Never reset or overwrite user changes without explicit permission.
- Avoid long-running heavy builds on the nano VM when the production service is under load.
- Prefer one Codex/tmux session at a time on this VM.
