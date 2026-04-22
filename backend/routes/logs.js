import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../auth.js";

const r = Router();
r.use(requireAuth);

// Upsert day log
r.put("/:date", (req, res) => {
  const { date } = req.params;
  const { weight_kg, fasting_type, steps, water_ml, coffee_ml, sleep_hours, mood, notes, source, sent_at, energy, hunger, headache } = req.body || {};
  const syncSource = source || req.get("x-fit-source") || null;
  const syncSentAt = sent_at || req.get("x-fit-sent-at") || null;
  const now = new Date().toISOString();

  if (steps !== undefined || syncSource || syncSentAt) {
    console.log("[logs.sync]", JSON.stringify({
      user_id: req.user.id,
      date,
      steps: steps ?? null,
      source: syncSource,
      sent_at: syncSentAt,
      received_at: now
    }));
  }

  const existing = db.prepare("SELECT id FROM daily_logs WHERE user_id = ? AND date = ?").get(req.user.id, date);
  if (existing) {
    db.prepare(`UPDATE daily_logs SET
      weight_kg = COALESCE(?, weight_kg),
      fasting_type = COALESCE(?, fasting_type),
      steps = COALESCE(?, steps),
      water_ml = COALESCE(?, water_ml),
      coffee_ml = COALESCE(?, coffee_ml),
      sleep_hours = COALESCE(?, sleep_hours),
      mood = COALESCE(?, mood),
      notes = COALESCE(?, notes),
      source = COALESCE(?, source),
      sent_at = COALESCE(?, sent_at),
      energy = COALESCE(?, energy),
      hunger = COALESCE(?, hunger),
      headache = COALESCE(?, headache),
      updated_at = ?
      WHERE id = ?`).run(weight_kg, fasting_type, steps, water_ml, coffee_ml, sleep_hours, mood, notes, syncSource, syncSentAt, energy, hunger, headache, now, existing.id);
  } else {
    db.prepare(`INSERT INTO daily_logs (user_id, date, weight_kg, fasting_type, steps, water_ml, coffee_ml, sleep_hours, mood, notes, source, sent_at, energy, hunger, headache, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(req.user.id, date, weight_kg, fasting_type, steps, water_ml, coffee_ml, sleep_hours, mood, notes, syncSource, syncSentAt, energy, hunger, headache, now);
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
