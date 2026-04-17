import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../auth.js";

const r = Router();
r.use(requireAuth);

// GET /api/habits/:date — all habit logs for date
r.get("/:date", (req, res) => {
  const rows = db.prepare("SELECT habit_id, completed FROM habit_logs WHERE user_id = ? AND date = ?")
    .all(req.user.id, req.params.date);
  const map = {};
  rows.forEach((row) => { map[row.habit_id] = !!row.completed; });
  res.json(map);
});

// POST /api/habits/:date — toggle one habit
r.post("/:date", (req, res) => {
  const { habit_id, completed } = req.body || {};
  if (!habit_id) return res.status(400).json({ error: "habit_id_required" });
  const c = completed ? 1 : 0;
  db.prepare(`INSERT INTO habit_logs (user_id, date, habit_id, completed)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, date, habit_id) DO UPDATE SET completed = excluded.completed`)
    .run(req.user.id, req.params.date, habit_id, c);
  res.json({ habit_id, completed: !!c });
});

// GET /api/habits/streak/current — consecutive days with >=80% completion of any logged habits
r.get("/streak/current", (req, res) => {
  const rows = db.prepare(`SELECT date, SUM(completed) AS done, COUNT(*) AS total
    FROM habit_logs WHERE user_id = ? GROUP BY date ORDER BY date DESC`).all(req.user.id);
  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  let cursor = today;
  for (const row of rows) {
    if (row.date !== cursor) break;
    const pct = row.total > 0 ? row.done / row.total : 0;
    if (pct < 0.8) break;
    streak += 1;
    const d = new Date(cursor);
    d.setDate(d.getDate() - 1);
    cursor = d.toISOString().slice(0, 10);
  }
  res.json({ streak });
});

export default r;
