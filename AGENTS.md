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

## Frontend Rules for Fit App

- Preserve the current compact dark PWA visual language unless the user explicitly asks for a redesign.
- Do not add explanatory helper copy inside the app unless the user asks; the UI should stay direct and quiet.
- Prefer dense, tappable controls over large marketing-style sections. This app is a daily tool, not a landing page.
- Use the existing component system in `frontend/src/components/ui.jsx` and existing CSS tokens before adding new patterns.
- Use `lucide-react` icons already exposed through the local `Icon` helper when an icon button is needed.
- Keep text inside compact cards short enough for mobile. Avoid oversized headings inside cards.
- Do not use nested cards. Use cards only for real repeated items, tools, or compact panels.
- Avoid visible instructions like "choose this" or "how to use"; if the flow is unclear, improve the control itself.
- Avoid `transition-all`; animate only `transform`, `opacity`, color, or border/background where needed.
- Keep repeated controls stable in size so check states, weight values, and labels do not shift layout.
- If changing layout or navigation, verify on mobile width and desktop width before deploy.
- If a screenshot comparison is needed, run the Vite app locally or inspect the deployed PWA. This repo does not use the Windows `serve.mjs` / `screenshot.mjs` workflow.
- If `brand_assets/` is ever added, check it before creating new colors, logos, or visual assets.

## Operating Style

- Keep changes small, testable, and deployable.
- Preserve the current visual language unless explicitly redesigning.
- Never reset or overwrite user changes without explicit permission.
- Avoid long-running heavy builds on the nano VM when the production service is under load.
- Prefer one Codex/tmux session at a time on this VM.
