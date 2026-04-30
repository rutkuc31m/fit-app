# Fit App Working Context

Last updated: 2026-04-30

This file preserves the current product and coaching context so future Codex sessions can continue without relying on chat compaction.

## User Goal

- Primary goal: cut from roughly 90 kg toward a lean, athletic 70-73 kg range while keeping or building muscle.
- Visual target: lean, defined, visible abs; not skinny-fat.
- Preferred style: simple, direct app flows with minimal instructional text. The user knows what the app is for and dislikes repeated guidance copy.
- The user prefers working iteratively with Codex: log real meals/training, then ask for feedback and next-session recommendations.

## Nutrition Plan

- Current default intake target: about 1500-1800 kcal on normal cut days.
- Protein target: about 150 g/day minimum, often 150-170 g/day.
- Main preferred protein sources: chicken, fish, skyr, eggs, whey, tuna, cottage cheese.
- Preferred carbs: quinoa, rice when useful, vegetables, occasional gluten-free bread or corn-based items.
- User eats mostly OMAD, but gym days may be split:
  - Lunch or earlier meal around 1000 kcal.
  - Post-workout skyr/whey/mandel drink around 500 kcal.
- Fast days remain part of the six-month plan when sustainable. The user currently does not eat on fast days.
- Sunday can be a free/cheat meal day in the app hero: `free/cheat`, about 2000 kcal.
- Cheat meals are logged by photo/manual backend discussion with Codex instead of fragile online restaurant search.
- User likes high-volume clean meals with cucumber, zucchini, iceberg, peppers, spinach, tomatoes.
- Hydration: water and coffee are tracked separately; total hydration is water plus coffee.
- Zero drinks:
  - Black coffee is acceptable and important to user.
  - Cola Zero with meals is acceptable if it does not increase cravings.
  - Monster White / Red Bull Zero are occasional tools, not daily hydration.

## Frequently Used Foods

- Rossmann zero sugar mandel drink, often 300 ml with whey.
- Vanilla whey, often 30-60 g.
- Skyr, commonly 400 g.
- REWE Bio Skyr Natur 400 g.
- REWE Bio Koerniger Frischkaese 200 g.
- Chicken breast, commonly 350-400 g cooked/logged.
- Eggs, tuna, quinoa, zucchini, cucumber, spinach, cherry tomatoes.
- Current 2026-04-30 base meal after edits:
  - REWE Bio Koerniger Frischkaese 200 g
  - Chicken breast 350 g
  - Spinach 40 g
  - Cherry tomatoes 10 pcs
  - REWE Bio Skyr Natur 400 g
  - Olive oil 10 g
  - Small cucumber 2 pcs
  - Approx total before shake: 997.5 kcal, 154.8 g protein, 34.9 g carbs, 26.5 g fat.

## Training Direction

- Current app training concept: gym80 machine catalog and logbook, not fixed GIF exercise coaching.
- User trains at All Inclusive Fitness Hannover City / Arndtstrasse.
- Machines are marked with a local star when seen in the gym.
- Recommended gym80 machines are filtered with `Rec`.
- User can log done machines by tapping/checking items.
- The user wants machine-based training because compound free-weight form is harder while core strength is still developing.
- Current planned structure: 3-day fullbody A/B/C, about 60 minutes per session.
- User is considering 4 days per week at about 45 minutes each; needs research-backed brainstorming before changing.
- Current priorities:
  - Preserve/build muscle during cut.
  - Use controlled machine work.
  - Train close to failure, usually 1-3 RIR.
  - Avoid ego lifting and avoid form breakdown.
  - Protect elbows/shoulders; recent triceps soreness was muscular, not joint pain.
- Core/abs are important, especially upper and lower abs. User likes ab machines.
- Cardio:
  - Phase 1: no HIIT.
  - Incline walking/LISS is preferred after gym when recovery allows.
  - Walking to/from gym also counts as warmup/LISS.

## Fullbody Plan Added To App

Commit: `152e694 Add fullbody training plan`

- `frontend/src/lib/gym80Catalog.js` exports `FULLBODY_PLAN`.
- `frontend/src/pages/Training.jsx` shows the Fullbody A/B/C card above the gym80 machine filters.
- Plan rows resolve to a gym-available starred machine first, then recommended machines, then the first matching candidate.
- Tapping a plan row logs/toggles that machine for today's training log.

Plan shape:

- Fullbody A, focus `push + quads`
  - Leg Press
  - Chest Press
  - Seated Row
  - Shoulder Lateral Raise
  - Leg Curl
  - Ab Crunch
- Fullbody B, focus `pull + hamstrings/core`
  - Leg Curl
  - Lat Pulldown
  - Incline Chest Press
  - Low / High Row
  - Abduction / Glute
  - Abdominal & Back
- Fullbody C, focus `balanced + pump`
  - Leg Extension
  - Leg Curl
  - Chest Press / Butterfly
  - Lat Pulldown / Pull Over
  - Shoulder Lateral Raise
  - Biceps + Triceps
  - Ab Crunch

## App Product Decisions

- The app should be compact, modern, green-accented, and card-light.
- Remove redundant text and explanations where the UI already makes intent clear.
- Avoid bottom-bar overlap for modals, dropdowns, photo flows, and focused detail views.
- Current tabs/cards should follow the Today visual language.
- Photo uploads are now general progress photos:
  - No front/side/back/legs split in UI.
  - Photos are not displayed in the app for now.
  - The app shows saved/upload count.
  - Photos are stored in backend so Codex can inspect them when asked.
- Step tracking UI was removed because iPhone Shortcut day aggregation was unreliable.
- Recovery signal uses energy, hunger, and headache.
- Weekly review endpoint: `/api/stats/weekly-review`.
- Meals can be edited after adding.
- Food history should support quick reuse and edit quantity after selecting.
- Manual meal/product search should stay simple; avoid fragile automatic online matching.

## Deployment State

- Production frontend: `https://fit.rutkuc.com`
- Production API: `https://api.fit.rutkuc.com`
- Backend service: `fitapi`
- Reverse proxy: `caddy`
- Production backend path: `/opt/fitapi`
- Production frontend path: `/var/www/fitapp`
- Development workspace: `/home/ubuntu/fit-app`
- Do not use `/opt/fitapi` as the development workspace.

Recent deployed commits:

- `152e694 Add fullbody training plan`
- `9e9e5a4 Fix progress photo saved count`
- `888c9c2 Use general progress photo uploads`
- `ce76e99 Add countable vegetable presets`
- `8a9fb3b Add gym80 availability marker`

Known local untracked items:

- `.codex`
- `data/`

Do not delete or reset these without explicit user approval.

## Checks And Deploy Commands

Frontend checks:

```bash
cd frontend
npm audit --omit=dev
npm run build
```

Backend checks:

```bash
node --check backend/db.js
node --check backend/server.js
find backend/routes backend/jobs backend/lib -name '*.js' -print0 | xargs -0 -n1 node --check
node --check backend/push_worker.js
```

Frontend deploy from fresh clone:

```bash
sha=$(git rev-parse --short HEAD)
deploy=/tmp/fit-app-deploy-$sha-$(date +%H%M%S)
git clone --depth 1 --branch main /home/ubuntu/fit-app "$deploy"
sudo APP_DIR="$deploy" bash "$deploy/backend/scripts/deploy_frontend.sh"
```

Backend deploy:

```bash
sudo cp backend/db.js backend/server.js /opt/fitapi/
sudo cp -r backend/routes backend/jobs backend/scripts backend/lib /opt/fitapi/
sudo systemctl restart fitapi
sudo bash /opt/fitapi/scripts/smoke_check.sh
```

Smoke check:

```bash
bash backend/scripts/smoke_check.sh
```

