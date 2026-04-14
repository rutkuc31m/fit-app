# fit.rutkuc.com

Personal fitness tracker — 6-month transformation protocol (ADF-hybrid fasting + A/B/C split).
Live: https://fit.rutkuc.com · API: https://api.fit.rutkuc.com

## Stack

- **Backend**: Node 22+ · Express · built-in `node:sqlite` · JWT · bcryptjs. Runs on Oracle VM as `fitapi.service` (port 8001).
- **Frontend**: Vite · React 18 · Tailwind · react-i18next (EN/DE) · PWA · html5-qrcode. Served by Caddy from `/var/www/fitapp`.
- **Barcode**: camera → OpenFoodFacts API → server-side 30-day cache.
- **Theme**: tank-app neon phosphor lime on dark.

## Structure

```
fit-app/
├── backend/
│   ├── server.js        # Express app
│   ├── db.js            # SQLite schema + helpers
│   ├── auth.js          # JWT middleware
│   ├── routes/          # auth, logs, meals, foods, training, measurements, checkins, photos
│   ├── data/            # fit.db (gitignored)
│   ├── Caddyfile
│   ├── deploy.sh
│   └── package.json
└── frontend/
    ├── src/
    │   ├── pages/       # Dashboard, Log, Training, Progress, Settings, Login
    │   ├── components/
    │   ├── lib/         # api client, auth store, plan data
    │   └── i18n/        # en.json, de.json
    ├── public/
    └── package.json
```

## Local dev

```bash
cd backend && npm install && npm run dev     # :8001
cd frontend && npm install && npm run dev    # :5173
```

## Deploy

- Frontend: `git push` → VM cron pulls → served at `fit.rutkuc.com`
- Backend: `scp` + `systemctl restart fitapi`

See `backend/deploy.sh`.

## Plan data

Based on `../transformation_plan_v2.json` — 6-month, 4-phase, ADF-hybrid.
Start: 2026-04-20 · End: 2026-10-20.
