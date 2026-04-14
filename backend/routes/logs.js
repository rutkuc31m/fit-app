import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../auth.js";

const r = Router();
r.use(requireAuth);

// Upsert day log
r.put("/:date", (req, res) => {
  const { date } = req.params;
  const { weight_kg, fasting_type, steps, water_ml, sleep_hours, mood, notes } = req.body || {};
  const existing = db.prepare("SELECT id FROM daily_logs WHERE user_id = ? AND date = ?").get(req.user.id, date);
  if (existing) {
    db.prepare(`UPDATE daily_logs SET
      weight_kg = COALESCE(?, weight_kg),
      fasting_type = COALESCE(?, fasting_type),
      steps = COALESCE(?, steps),
      water_ml = COALESCE(?, water_ml),
      sleep_hours = COALESCE(?, sleep_hours),
      mood = COALESCE(?, mood),
      notes = COALESCE(?, notes)
      WHERE id = ?`).run(weight_kg, fasting_type, steps, water_ml, sleep_hours, mood, notes, existing.id);
  } else {
    db.prepare(`INSERT INTO daily_logs (user_id, date, weight_kg, fasting_type, steps, water_ml, sleep_hours, mood, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(req.user.id, date, weight_kg, fasting_type, steps, water_ml, sleep_hours, mood, notes);
  }
  res.json(db.prepare("SELECT * FROM daily_logs WHERE user_id = ? AND date = ?").get(req.user.id, date));
});

r.get("/:date", (req, res) => {
  const log = db.prepare("SELECT * FROM daily_logs WHERE user_id = ? AND date = ?").get(req.user.id, req.params.date);
  res.json(log || null);
});

// Range for charts
r.get("/", (req, res) => {
  const { from, to } = req.query;
  const rows = db.prepare(
    "SELECT * FROM daily_logs WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date ASC"
  ).all(req.user.id, from || "1900-01-01", to || "2999-12-31");
  res.json(rows);
});

export default r;
