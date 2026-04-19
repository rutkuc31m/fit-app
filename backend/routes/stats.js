import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../auth.js";

const r = Router();
r.use(requireAuth);

const prevDate = (s) => {
  const d = new Date(s); d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

// GET /api/stats/streaks — current streaks for weight-log / fast / training
r.get("/streaks", (req, res) => {
  const uid = req.user.id;
  const today = new Date().toISOString().slice(0, 10);

  // Weight streak: consecutive days ending today with weight_kg logged
  const weightRows = db.prepare(
    "SELECT date FROM daily_logs WHERE user_id = ? AND weight_kg IS NOT NULL ORDER BY date DESC"
  ).all(uid).map((r) => r.date);
  let weightStreak = 0; let cur = today;
  for (const d of weightRows) {
    if (d !== cur) break;
    weightStreak += 1; cur = prevDate(cur);
  }

  // Fast streak: consecutive days with fasting_type set
  const fastRows = db.prepare(
    "SELECT date FROM daily_logs WHERE user_id = ? AND fasting_type IS NOT NULL AND fasting_type != '' ORDER BY date DESC"
  ).all(uid).map((r) => r.date);
  let fastStreak = 0; cur = today;
  for (const d of fastRows) {
    if (d !== cur) break;
    fastStreak += 1; cur = prevDate(cur);
  }

  // Training streak: consecutive training-scheduled days completed.
  // Simple version: consecutive days with completed=1 session (non-training days don't break streak)
  const sessionRows = db.prepare(
    "SELECT date, completed FROM training_sessions WHERE user_id = ? ORDER BY date DESC"
  ).all(uid);
  let trainingStreak = 0;
  for (const s of sessionRows) {
    if (!s.completed) break;
    trainingStreak += 1;
  }

  res.json({ weightStreak, fastStreak, trainingStreak });
});

export default r;
