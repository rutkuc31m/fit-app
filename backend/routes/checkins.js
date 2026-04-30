import { Router } from "express";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import db from "../db.js";
import { requireAuth } from "../auth.js";

const r = Router();
r.use(requireAuth);

const PHOTO_DIR = process.env.FIT_PHOTO_DIR || "./data/photos";
mkdirSync(PHOTO_DIR, { recursive: true });

const V2_FIELDS = [
  "date", "avg_weight", "weight_change", "training_done", "avg_steps",
  "avg_kcal", "avg_protein_g", "challenges", "adjustments",
  "energy", "sleep_quality", "back_pain", "motivation", "adherence_pct", "notes",
  "photo_front", "photo_side", "photo_back", "photo_legs"
];

r.get("/", (req, res) => {
  res.json(db.prepare("SELECT * FROM weekly_checkins WHERE user_id = ? ORDER BY week_number ASC").all(req.user.id));
});

r.get("/:week", (req, res) => {
  const week = parseInt(req.params.week, 10);
  const row = db.prepare("SELECT * FROM weekly_checkins WHERE user_id = ? AND week_number = ?").get(req.user.id, week);
  const today = new Date().toISOString().slice(0, 10);
  const counts = db.prepare(`
    SELECT angle, COUNT(*) AS count
    FROM progress_photos
    WHERE user_id = ? AND date = ?
    GROUP BY angle
  `).all(req.user.id, today);
  const totalCount = counts.reduce((sum, r) => sum + Number(r.count || 0), 0);
  res.json({
    ...(row || { week_number: week, date: today }),
    photo_counts: { ...Object.fromEntries(counts.map((r) => [r.angle, r.count])), total: totalCount }
  });
});

r.put("/:week", (req, res) => {
  const week = parseInt(req.params.week, 10);
  const body = req.body || {};
  if (body.date === undefined) body.date = new Date().toISOString().slice(0, 10);
  const existing = db.prepare("SELECT id FROM weekly_checkins WHERE user_id = ? AND week_number = ?").get(req.user.id, week);

  const provided = V2_FIELDS.filter((f) => body[f] !== undefined);

  if (existing) {
    if (provided.length === 0) return res.json(db.prepare("SELECT * FROM weekly_checkins WHERE id = ?").get(existing.id));
    const setClause = provided.map((f) => `${f} = ?`).join(", ");
    const values = provided.map((f) => body[f]);
    values.push(existing.id);
    db.prepare(`UPDATE weekly_checkins SET ${setClause} WHERE id = ?`).run(...values);
  } else {
    const cols = ["user_id", "week_number", ...provided];
    const vals = [req.user.id, week, ...provided.map((f) => body[f])];
    const placeholders = cols.map(() => "?").join(", ");
    db.prepare(`INSERT INTO weekly_checkins (${cols.join(", ")}) VALUES (${placeholders})`).run(...vals);
  }
  res.json(db.prepare("SELECT * FROM weekly_checkins WHERE user_id = ? AND week_number = ?").get(req.user.id, week));
});

// POST /api/checkins/:week/photo  — body { angle?: "general"|"front"|"side"|"back"|"legs", data_url: "data:image/jpeg;base64,..." }
r.post("/:week/photo", (req, res) => {
  const week = parseInt(req.params.week, 10);
  const { data_url, date } = req.body || {};
  const angle = req.body?.angle || "general";
  const photoDate = date || new Date().toISOString().slice(0, 10);
  if (!["general", "front", "side", "back", "legs"].includes(angle)) return res.status(400).json({ error: "bad_angle" });
  if (!data_url || !data_url.startsWith("data:image/")) return res.status(400).json({ error: "bad_data" });

  const m = data_url.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!m) return res.status(400).json({ error: "bad_format" });
  const ext = m[1] === "jpeg" ? "jpg" : m[1];
  const buf = Buffer.from(m[2], "base64");
  const fname = `u${req.user.id}_w${week}_${angle}_${Date.now()}.${ext}`;
  const userDir = join(PHOTO_DIR, String(req.user.id));
  if (!existsSync(userDir)) mkdirSync(userDir, { recursive: true });
  writeFileSync(join(userDir, fname), buf);
  const relPath = `/photos/${req.user.id}/${fname}`;

  const existing = db.prepare("SELECT id FROM weekly_checkins WHERE user_id = ? AND week_number = ?").get(req.user.id, week);
  if (!existing) {
    db.prepare("INSERT INTO weekly_checkins (user_id, week_number, date) VALUES (?, ?, ?)")
      .run(req.user.id, week, photoDate);
  }

  // Keep legacy angle columns working, but general photos only go to progress history.
  if (angle !== "general") {
    const col = `photo_${angle}`;
    const row = db.prepare("SELECT id FROM weekly_checkins WHERE user_id = ? AND week_number = ?").get(req.user.id, week);
    db.prepare(`UPDATE weekly_checkins SET ${col} = ? WHERE id = ?`).run(relPath, row.id);
  }

  db.prepare("INSERT INTO progress_photos (user_id, date, path, angle) VALUES (?, ?, ?, ?)")
    .run(req.user.id, photoDate, relPath, angle);
  const countToday = db.prepare(
    "SELECT COUNT(*) AS count FROM progress_photos WHERE user_id = ? AND date = ?"
  ).get(req.user.id, photoDate)?.count || 0;

  res.json({ angle, path: relPath, count_today: countToday });
});

export default r;
