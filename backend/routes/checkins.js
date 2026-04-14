import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../auth.js";

const r = Router();
r.use(requireAuth);

r.get("/", (req, res) => {
  res.json(db.prepare("SELECT * FROM weekly_checkins WHERE user_id = ? ORDER BY week_number ASC").all(req.user.id));
});

r.put("/:week", (req, res) => {
  const week = parseInt(req.params.week, 10);
  const { date, avg_weight, weight_change, training_done, avg_steps, avg_kcal, avg_protein_g, challenges, adjustments } = req.body || {};
  const existing = db.prepare("SELECT id FROM weekly_checkins WHERE user_id = ? AND week_number = ?").get(req.user.id, week);
  if (existing) {
    db.prepare(`UPDATE weekly_checkins SET
      date = COALESCE(?, date), avg_weight = COALESCE(?, avg_weight),
      weight_change = COALESCE(?, weight_change), training_done = COALESCE(?, training_done),
      avg_steps = COALESCE(?, avg_steps), avg_kcal = COALESCE(?, avg_kcal),
      avg_protein_g = COALESCE(?, avg_protein_g),
      challenges = COALESCE(?, challenges), adjustments = COALESCE(?, adjustments)
      WHERE id = ?`).run(date, avg_weight, weight_change, training_done, avg_steps, avg_kcal, avg_protein_g, challenges, adjustments, existing.id);
  } else {
    db.prepare(`INSERT INTO weekly_checkins
      (user_id, week_number, date, avg_weight, weight_change, training_done, avg_steps, avg_kcal, avg_protein_g, challenges, adjustments)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(req.user.id, week, date, avg_weight, weight_change, training_done, avg_steps, avg_kcal, avg_protein_g, challenges, adjustments);
  }
  res.json(db.prepare("SELECT * FROM weekly_checkins WHERE user_id = ? AND week_number = ?").get(req.user.id, week));
});

export default r;
