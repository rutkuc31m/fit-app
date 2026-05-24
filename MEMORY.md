# Fit App Working Memory

This file is the handoff memory for future Codex/agent sessions on `rutkuc31m/fit-app`.
Read `AGENTS.md` first, then this file. Do not store secrets here.

## Latest Handoff Snapshot - 2026-05-24

- Latest deployed app commit: `0f00b66 Fix quick food measure parsing`.
- Before answering implementation questions, read `AGENTS.md`, then this file.
- Current phase: Phase 2 started on Tuesday `2026-05-19` after Phase 1 ended. User wants phase checkpoints aligned to Tuesday fasted measurements.
- Latest stable checkpoint from Phase 1 end:
  - Weight: about `84 kg`
  - Waist: `94-95 cm` at navel, user notes previous `96 cm` may have been measured too tight and mentally treats it closer to `97 cm`
  - Neck: `39 cm`
  - Estimated body fat: roughly `23-25%`, not exact.
- User now prefers weekly fasting on Monday only, with Tuesday morning fasted measurement. Earlier 2x/week fasting was reduced for muscle retention.
- Current core app additions:
  - Football activity logging is deployed.
  - Training set `logged_date` tracking is deployed.
- Essen meal templates are deployed.
- Quick food entry measure parsing is deployed:
  - `1 kg ...` stays kilograms until Log converts it once.
  - `EL`/`TL`/tablespoon/teaspoon inputs are treated as gram estimates (`15g`/`5g`).
  - `halb zitrone` is treated as half a piece so the lemon preset scales correctly.
- Session cleanup on `2026-05-24` removed transient untracked repo files from a previous session: transcription venv, WhatsApp audio/transcript, local `data/` DB copy, empty `.codex`, and OCI ops logs/scripts. Production DB was not touched.
- Frontend deploy smoke initially failed because `/var/www/fitapp/gifs` symlink was missing while `/var/www/fitapp-gifs` existed. Symlink was restored and smoke then passed.
- UI slimming/redesign pass started on `2026-05-24`:
  - Bottom nav reduced to four core flows: Today, Essen, Training, Progress.
  - Settings moved to the top bar icon.
  - Supplement copy reflects current stack: D3+K2, magnesium, seasonal loratadine; no B12/Omega default.
  - Visual system moved toward tighter premium dark PWA surfaces with slimmer cards/nav.
  - Progress page was slimmed to core signals: top metrics, photos link, weekly review/adherence, chart, phase list.
  - Training plan rows were made denser by removing long inline explanation text and showing compact day progress.
- Do not start from scratch if session context is lost. The core product and user preferences are captured here.

## Current Project

- Repo: `rutkuc31m/fit-app`
- Workspace on VM: `/home/ubuntu/fit-app`
- Production backend path: `/opt/fitapi`
- Production frontend path: `/var/www/fitapp`
- App: `https://fit.rutkuc.com`
- Fit API: `https://api.fit.rutkuc.com`
- Pollen API also exists on this VM: `https://api.rutkuc.com` proxies to a different service. Do not confuse it with fit API.
- Backend service: `fitapi`
- Reverse proxy: `caddy`
- Production DB: `/opt/fitapi/data/fit.db`
- Public GIF cache: `/var/www/fitapp-gifs`, symlinked/served through `/gifs`.

## User / Communication

- User writes mostly Turkish mixed with German.
- User calls the assistant `Arthur` or sometimes `Anton`.
- User wants direct, pragmatic, low-fluff communication.
- User often asks for food calculations and asks the agent to write entries directly into the app/backend DB.
- User expects implementation, deployment, and smoke checks when app code changes.
- Preserve existing app ideas/workflows unless explicitly changing them.
- Do not add annoying explanatory copy in the UI. The user dislikes helper/anweisung text.

## Session Handling

- The user may connect to this VM through native ChatGPT/Codex over SSH instead of a third-party SSH app.
- This connection is not automatically a tmux session.
- For short commands, a normal shell is fine.
- For long-running or interruption-sensitive work, proactively use tmux before starting the task.
- Use tmux especially for deploys, builds, longer tests, log watching, dependency installs, migrations, DB maintenance, system updates, and restart-adjacent work.
- Goal: if the phone/native SSH connection drops, important work should continue safely on the VM.

## Operational Rules

- Use `/home/ubuntu/fit-app` as development workspace. Never edit `/opt/fitapi` as the source workspace.
- Before production changes: edit in workspace, build/check, commit and push to `main`, deploy, smoke check.
- Do not revert unrelated dirty files. Known recurring unrelated local state:
  - `frontend/src/lib/quickFoodEntry.js` may be modified from previous work.
  - `.codex/` and `data/` may be untracked.
- Common frontend build issue: root-owned `frontend/node_modules/.vite-temp` or `frontend/dist`. If build fails with `EACCES`, remove temp/dist and rebuild.
- Frontend deploy command that has worked:
  - `sudo env APP_DIR=/home/ubuntu/fit-app bash backend/scripts/deploy_frontend.sh`
- Backend deploy shape:
  - `sudo cp backend/db.js backend/server.js /opt/fitapi/`
  - `sudo cp -r backend/routes backend/jobs backend/scripts backend/lib /opt/fitapi/`
  - `sudo systemctl restart fitapi`
  - `sudo bash /opt/fitapi/scripts/smoke_check.sh`
- Smoke check expected final result: `fitapi: active`, `caddy: active`, API health OK, frontend assets OK, gifs OK, `ok`.
- Codex CLI was last seen installed globally via npm as `@openai/codex`. User checked update path from `0.128.0` to stable `0.130.0`.

## Frontend / Design Decisions

- Current app is a compact dark PWA. Preserve this unless user asks for redesign.
- Do not make landing-page style sections.
- Do not add visible instructions/helper paragraphs. Improve controls instead.
- Use existing UI components/tokens from `frontend/src/components/ui.jsx`.
- Use local `Icon` helper/lucide icons for icon buttons.
- Avoid nested cards.
- Avoid `transition-all`.
- Mobile layout matters most. Text must not overflow compact cards/buttons.
- Step tracking UI was removed because iPhone Shortcut day aggregation was unreliable.
- iOS input zoom prevention and pull-to-refresh should remain smooth.
- Bottom nav overlap has been a recurring issue; modals/dropdowns/photo controls must stay above it.

## Product State / Feature Decisions

- App tracks nutrition, fasting, training, hydration, recovery, photos, progress/stats.
- Meals can be edited after adding.
- Food history/recent add exists and should stay quick.
- Essen now has 6 static meal templates in `frontend/src/lib/mealTemplates.js`.
  - UI component is `MealTemplatePicker` in `frontend/src/pages/Log.jsx`.
  - Templates are shown in Essen as compact `Gerichte`.
  - User opens a template to see ingredients and macro totals.
  - Check button adds all template items to the selected day; green state means eaten/logged.
  - Pressing check again removes only that template's items for the selected day.
  - No backend schema was added. Template items are tracked with existing `meal_items.barcode = template:<id>`.
  - Keep this marker behavior if extending templates; it makes undo/status stable without a new table.
- Current static meal templates:
  - `potato_chicken`: Kartoffeln + Hähnchen + Körniger + Skyr/Whey
  - `potato_salmon_egg`: Kartoffeln + Lachs + Eier + Körniger + Skyr/Whey
  - `potato_tuna`: Kartoffeln + Thunfisch + Körniger + Skyr/Whey
  - `wrap_chicken`: Ja Vollkorn Wraps + Hähnchen + Körniger + Skyr/Whey
  - `wrap_rinderhack`: Ja Vollkorn Wraps + REWE Bio Rinderhack + Skyr Sauce + Whey
  - `rice_chicken`: Reis + Hähnchen + Körniger + Skyr/Whey
- Current weekly meal template split is 3 chicken, 1 tuna, 1 salmon, 1 lean beef, plus 1 fasting day. The second tuna template was replaced because the user preferred less weekly fish.
- Meal templates include `Senf + Zero Ketchup` as `40g` total (`20g` mustard + `20g` zero ketchup) wherever that sauce is used. User may vary chicken amount manually by day, commonly `300-400g`, so do not hardcode all chicken templates to 400g unless explicitly asked.
- Meal templates are displayed as day cards with two separately tappable/loggable parts:
  - `Ana öğün`
  - `Shake`
- Each part expands independently and logs/removes independently with barcode markers like `template:<id>:main` and `template:<id>:shake`. Keep legacy `template:<id>` compatibility if touching this area.
- Photo upload is general: user uploads progress photos without body-part sections. Photos should save to backend but not show as gallery in app for now.
- Food photos can be uploaded for later analysis; user may ask agent to inspect backend photos.
- Hydration tracks water and coffee separately, but total hydration is `water_ml + coffee_ml`.
- Recovery signal uses `energy`, `hunger`, and `headache` on `daily_logs`.
- Weekly review endpoint: `/api/stats/weekly-review`.
- Today call food/gym states should be user-selectable, not hardcoded:
  - Food options user wanted: `fast`, `train`, `cheat`.
  - Gym options user wanted: `rest`, `gym`, `cardio`.
- Nutrition target for `TRAIN` was changed to approximately:
  - `1700 kcal`
  - `170g protein`
  - `105g carbs`
  - `65g fat`

## User Fitness Goal

- Main goal: lean, masculine, defined body, not bodybuilding bulk.
- Visual reference: Brad Pitt / Fight Club style, but interpreted realistically for user.
- User wants thin waist, visible abs eventually, defined shoulders/back/chest/arms, not skinny-fat.
- Current priority: reduce body fat aggressively but controlled, while preserving or gaining muscle.
- User understands 6 months is a cut phase, not final lifestyle.
- Long-term after cut: sustainable maintenance/recomp with higher calories, weekly average logic, continued gym.
- User has history of dropping to 70-72 kg but still looking soft/skinny-fat because there was little strength training and likely muscle loss.
- Current system is meant to avoid that: high protein, machine/cable training, strength tracking, steps, sleep.

## Known Body Metrics / Timeline

- Height: `175 cm`
- Start around 2026-04-20:
  - Weight around `93 kg` in app, user mentioned pre-start up to `95.8-97 kg`.
  - Waist around `103 cm`.
  - Neck around `41 cm`.
  - Estimated body fat then roughly high 20s, user currently assumes `23-25%+` range after progress.
- Later measurements:
  - `87.9 kg`, waist `103 cm`, neck `41 cm`.
  - `86.5 kg`, waist `99.5 cm`, neck `40.5 cm`.
  - 2026-05-12 after fasting: `85.3 kg`, waist `96 cm`, neck `40 cm`.
  - 2026-05-19 / Phase 1 end after Monday fast: about `84 kg`, waist `94-95 cm`, neck `39 cm`.
- User tracks weekly Tuesday morning fasted measurements as the cleanest trend.
- Phase checkpoint/end dates should align with Tuesday morning fasted measurements. If a phase boundary/end is displayed as Sunday or Monday, shift the displayed checkpoint date to Tuesday.
- User cares more about waist trend and strength than daily scale noise.
- Waist goal eventually: around `76-78 cm` or as close as realistically sustainable.

## Nutrition Strategy

- Current cut target most days: `1700-1800 kcal`, high protein.
- Protein target: usually `160-180g/day`; `170g` is the app train target.
- User reduced fasting from 2 days/week to 1 day/week until later phases because muscle retention matters.
- Fasting day: no food. User tolerates fasting well and often feels focused.
- Gym/rest nutrition:
  - Gym day: roughly `1700-1800 kcal`, `160-180g protein`, controlled carbs.
  - Rest day: roughly `1500-1700 kcal`, `160-180g protein`, carbs can be lower but not zero.
  - Keto is not required. Controlled carbs from vegetables, fruit, wraps, rice/potato as needed are acceptable.
- User feels guilty when stomach is full even at 1700-1800 kcal. Remind: with 10-13k steps + gym, 1800 is still a cut, not overeating.
- User is moving toward repeatable daily templates rather than improvising every meal:
  - Main meal + evening skyr/whey/shake.
  - Keep protein high first; calories can vary by 2-3 day average if weekly trend is good.
  - User likes choosing from a fixed meal list in Essen instead of following recipe text.
- User likes high-volume foods: cucumber, zucchini, iceberg, paprika, broccoli/cauliflower, watermelon.
- User frequently eats: chicken breast, turkey, eggs, skyr, whey, zero almond milk, More Protein Wraps, cottage cheese/körniger Frischkäse, fish, tuna, salmon, quinoa/rice/potato, salads.
- User avoids or limits: sugar, gluten/bread, pizza except cheat/family days, nuts due calorie density, dates due calories.
- Whey + zero almond milk is a key tool; user likes vanilla whey with cinnamon/decaf coffee aroma.
- User's current Optimum Nutrition vanilla whey isolate label per 30g scoop: `108 kcal`, `25g protein`, `1.2g carbs`, `0.4g fat`. Use this for manual DB entries unless user changes product.
- Creatine: effective generally, but user suspects hair shedding from previous creatine use. Recommendation so far: skip for now, not necessary.
- Peptides/fat burners/metabolic peptides: discussed and not recommended; core system is enough.

## Food Logging Conventions

- User often asks agent to add food directly to DB. Use production DB carefully.
- Production DB path: `/opt/fitapi/data/fit.db`.
- `meals` and `meal_items` are used for food entries.
- Confirm the date. If user says "bugün", use Europe/Berlin current date.
- Do not add foods only discussed hypothetically. Add when user says "ekle", "yaz", "yedim", or similar.
- If the user's sentence contains "ekle" anywhere before/after a food list, treat it as an explicit instruction to write that food to the production DB unless the user clearly says not to. The user often asks hypothetical nutrition questions too; do not write those unless an add/write cue is present.
- User likes conservative/high estimates for buffet/restaurant meals.
- For buffet/restaurant meals, if uncertain, estimate high rather than low.
- For Apple Watch football/workouts, use active calories (`Aktiv`), not total calories (`Gesamt`), unless the user explicitly says otherwise.
- Recent example 2026-05-13 after correction:
  - 400g Skyr
  - 6 L eggs
  - 3 More Protein Wraps
  - 250g Lachsfilet
  - 200g Exquisa Fitline Körniger Frischkäse
  - 1 red paprika
  - 1 M banana
  - 260ml zero almond milk
  - Total after final wrap: about `1785 kcal`, `197g protein`, `109g carbs`, `59g fat`.
- 2026-05-14 buffet/cheat-clean estimate:
  - 400g broccoli/cauliflower
  - 200g fatty wild salmon
  - 250g boiled potatoes
  - 300g lean/trimmed rindersteak
  - 100g shrimp
  - 150g cooked rice
  - Conservative/high estimate around `1760 kcal`, `157g protein`, `110g carbs`, `70g fat`; real may be lower because steak was lean.

## Training Strategy

- User dislikes long gym sessions. Core success factor is short sessions.
- Current system: 4 days/week, 4 movements/day, about 25-35 minutes/session.
- Main goal is sustainable upper-body training during cut: preserve/gain muscle, improve definition, avoid skinny-fat.
- User does not train legs directly right now because legs are already muscular from cycling/football history.
- Focus: upper body plus core/back support: chest, shoulders, back/lats, triceps, biceps, abs, lower back/glute support.
- User prefers machines/cables due control and form; avoids complicated free-weight compound lifts for now.
- Program should be flexible by week:
  - Ideal: Day 1, rest, Day 2, rest, Day 3, rest, Day 4.
  - If schedule forces it, two consecutive gym days are allowed.
  - Goal is to complete four days in the week, not attach them to fixed weekdays.
- Rest days can include 10-13k steps / forest walk as active recovery.
- User sometimes feels "missing out" when not gyming. Remind: rest is part of the program.
- Football/top is now part of Phase 2 cardio and enjoyment:
  - Track manually in app with minutes and active kcal from Apple Watch.
  - User enjoys 20-35 minute football sessions and reports rapid cardio improvement.
  - Treat it as cardio/conditioning, not leg hypertrophy programming.

## Training Intensity / Hypertrophy Rule

- Research-based rule discussed:
  - Hypertrophy is muscle growth/thickening, not just pump/pain.
  - Main signal is mechanical tension.
  - Failure every set is not required.
  - Most sets should be around `1-3 RIR`.
  - For safe machines/cables, last set can approach `0-1 RIR`.
- User's natural set pattern is good:
  - Set 1: about 2-3 reps in reserve.
  - Set 2: about 1-2 reps in reserve.
  - Set 3: hard, often 0-1 reps in reserve.
- Progression rule:
  - If 3x10 is clean and still easy, increase next time.
  - If third set reaches 8-9 with hard effort, weight is fine.
  - Avoid ego lifting; form and joint comfort matter.
- User tracks weight per movement in 5kg steps, starting around 20kg.

## Current Gym80 Training Plan

Training page is in `frontend/src/pages/Training.jsx`.

Current plan is machine/cable based and generated from user's actual gym machine whitelist.
Each movement has an `entryId` like `Day 1|chest|gym80-3041`; same machine on different day/slot must be tracked separately.

Day 1 - Push A:
- Chest press / butterfly
  - Area: mid chest / pecs
  - Primary: `3041` Dual Chest Press
  - Alternatives include `3016`, `5014`
- Shoulder press / lateral raise
  - Area: front + side delts
  - Primary: `3043` Dual Shoulder Press
- Rope pushdown / triceps extension
  - Area: triceps
  - Primary should be cable/rope `4012` when available
  - `3011` remains alternative
- Ab crunch
  - Area: upper abs
  - Primary: `5012`

Day 2 - Pull A:
- Lat pulldown
  - Area: lats / upper back width
  - Primary: `3044`
- Seated row / t-bar row
  - Area: mid back / traps
  - Primary: `3040`
- Biceps curl
  - Area: biceps
  - Primary: `3098`
  - User often leaves this lighter/optional because biceps are already tired from first two back movements.
- Back extension
  - Area: lower back / glutes
  - Primary: `5012`

Day 3 - Upper B:
- Incline chest press / chest press
  - Area: upper chest / pecs
  - Primary: `3041`
- Row / lat pulldown
  - Area: lats + mid back
  - Primary: `4170`
- Shoulder press / lateral raise
  - Area: front + side delts
  - Primary: `3043`
- Rope pushdown / biceps curl
  - Area: triceps / biceps
  - Primary includes `4012` for rope/cable; `3011`, `4379`, `4366`, `4355` alternatives.

Day 4 - Pull B:
- Row / lat pulldown
  - Area: lats + mid back
  - Primary: `3044`
- Reverse butterfly / lateral raise
  - Area: rear + side delts
  - Primary: `5014`
- Dip / triceps extension
  - Area: lower chest / triceps
  - Primary: `3017` Chin Dip Assist
  - User likes this because it hits chest/triceps well and feels unique.
- Back extension
  - Area: lower back / glutes
  - Primary: `5012`

## Football / Activity Logging

- Feature deployed in commit `984273c Add football activity logging`.
- Backend has `activity_logs` table and `/api/training/activity` endpoints.
- Frontend has compact football card in `frontend/src/pages/Training.jsx`.
- User should enter Apple Watch active calories (`Aktiv`) and minutes.
- Known logged examples:
  - `2026-05-19`: 25 min / 320 kcal
  - `2026-05-20`: 26 min / 300 kcal
  - `2026-05-21`: 30 min / 372 kcal
  - `2026-05-22`: 30 min / 333 kcal
  - `2026-05-23`: 35 min / 360 kcal

Turkish area translations user asked for:
- `delts` = omuz kasları / deltoid.
- `front delt` = ön omuz.
- `side delt` = yan omuz.
- `rear delt` = arka omuz.
- `lats` = kanat / sırt genişliği.
- `mid back` = orta sırt.
- `lower chest` = alt göğüs.
- `upper chest` = üst göğüs.

## Training Bugs / State Notes

- Recurring bug: old/corrupt training sessions caused random Day 1/2/3/4 items to appear checked.
- Fix deployed in commit `a055671 Prefer latest open training cycle`:
  - open cycle selection now prefers latest incomplete session instead of most-filled incomplete session.
  - same Day/slot can map across machine changes, so old `Day 1|triceps|gym80-3011` can still count if current primary changed to `4012`.
- Old problematic sessions exist:
  - 2026-05-09 session id `24` has many/corrupt duplicate sets.
  - 2026-05-08 session id `23` has old mixed state.
  - 2026-05-12 session id `26` is a clean Day 1 session with 4 sets.
- Be careful if modifying cycle logic. User expects checked state to persist correctly until full cycle completion.
- Desired cycle behavior:
  - Completing Day 1 should not mark unrelated days.
  - Same machine used in different slots must be separate by Day/slot.
  - When all four days are fully done, next cycle can reset; if not full, do not auto-reset.

## Photos / Progress Analysis

- Progress photos table: `progress_photos`.
- Latest progress photos around 2026-05-14:
  - `/opt/fitapi/data/photos/1/u1_w4_general_1778787637194.jpg`
  - `/opt/fitapi/data/photos/1/u1_w4_general_1778787636699.jpg`
- User asked for arm analysis:
  - Upper arm looks less "wabbelig".
  - Triceps separation is beginning despite still-high body fat.
  - Biceps/triceps and shoulder-arm transition are more visible.
  - This was used as evidence that muscle exists and the system is working.
- User wants photos to save silently; app should not display a gallery yet.

## Recent Important Commits

- `0f00b66 Fix quick food measure parsing`
- `8cbe78a Adjust weekly meal template protein split`
- `15066e8 Split meal templates into meal parts`
- `5dcac98 Add sauce to chicken meal templates`
- `1663af8 Increase template sauce portions`
- `98e95db Slim and refresh app shell`
- `22f71fd Simplify progress and training screens`
- `02d0448 Add meal template picker`
- `33241ef Track training set log dates`
- `984273c Add football activity logging`
- `bb9bd86 Align phase checkpoints to Tuesday`
- `434e348 Add Turkish muscle labels to training`
- `b0b736c Expand training movement details`
- `5313aa3 Add working memory notes`
- `a055671 Prefer latest open training cycle`
- `482ecd0 Show muscle targets in training plan`
- `ef4a8e6 Prefer cable triceps movements`
- `8c32c15 Adjust train nutrition targets`
- `866f30a Refine app UI copy and flow`
- `95f1e9f Add fit app frontend rules`

## May 2026 Redesign / Nutrition Decisions

- User explicitly requested a full slimmer redesign after earlier rule said preserve compact dark UI; redesign permission applies.
- App shell now has 4 bottom tabs: Today, Essen, Training, Progress. Settings moved to topbar icon.
- User wants app lean, direct, modern, no unused/verbose areas.
- On 2026-05-24 user clarified they wanted a visually different, more modern root redesign, not just slimming.
- New visual direction: matte command UI, warm graphite/ivory base, acid-lime primary, amber/cyan/coral semantic accents, floating capsule topbar, pill dock bottom nav.
- Later on 2026-05-24 user requested `$uncodixfy` redesign. New direction supersedes the matte command UI:
  - normal dark product UI, not "command/control room".
  - solid graphite surfaces, subtle borders, no decorative gradients/glows/rails.
  - no pill dock; simple fixed bottom nav with solid background.
  - no uppercase/letter-spaced eyebrow style by default.
- Later same day:
  - Today screen recovery signal removed because user does not use it.
  - Today screen hydration removed because user does not use it.
  - Weight logging moved to Progress/Stats.
  - Production DB 2026-05-24 added separate `Shake` meal: template potato_chicken shake + 20g chiasamen + 1 kiwi + 1 large cucumber.
  - 2026-05-24 total after shake: 1680 kcal, P197.7, C166.4, F23.4.
- Nutrition plan:
  - 6 eating days + 1 fast day.
  - Protein split: 3 chicken, 1 tuna, 1 salmon, 1 lean beef.
  - Meal templates are split into `Ana ogun` and `Shake`; each part logs independently.
  - Chicken templates include 20g mustard + 20g zero ketchup in templates.
  - Today 2026-05-24 manually logged: 500g boiled potatoes, 400g chicken breast, 200g Fitline cottage cheese, 250g paprika, 20g sauce total.
- Supplements:
  - D3+K2 Sunday + Wednesday.
  - Magnesium complex in the evening, start with 1 capsule.
  - No B12 by default, no omega by default.
  - Loratadin seasonal allergy support; black seed oil stopped because it did not help.

## DNS / SSH

- DNS currently resolves to VM:
  - `api.rutkuc.com -> 92.5.70.160`
  - `fit.rutkuc.com -> 92.5.70.160`
  - `api.fit.rutkuc.com -> 92.5.70.160`
- SSH can use `ubuntu@api.rutkuc.com` instead of the raw IP.
- Example user command used:
  - `ssh -i .ssh/oracle-fit.key ubuntu@api.rutkuc.com`
- Again: `api.rutkuc.com` as HTTP is pollen API, not fit API.

## Health / Safety Framing

- User is not asking for medical treatment but discusses aggressive cutting, fasting, supplements, peptides, creatine.
- Keep advice conservative:
  - high protein, resistance training, sleep, steps, hydration/electrolytes.
  - avoid unneeded peptides/fat burners.
  - fast is okay if user feels good, but reduce if strength, sleep, mood, or recovery worsens.
  - do not push extreme `65-68 kg` target prematurely.
- User may want to cut to very low body weight if abs do not show. Reframe to waist + strength + mirror checkpoints:
  - evaluate strongly at `75-77 kg`.
  - `70-72 kg` only if strength and look remain good.
  - below `70 kg` is not a default plan.

## Likely Next Questions

- Food add/calculation for today's meals.
- Training checked-state bugs.
- Whether a gym/rest day should be counted or logged.
- Whether a meal fits 1700-1800 kcal target.
- Photo/body composition analysis.
- Phase/weight/waist forecast.
- Deploy/build/debug requests from phone-native SSH context.
