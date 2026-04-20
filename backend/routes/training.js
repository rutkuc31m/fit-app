import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../auth.js";

const r = Router();
r.use(requireAuth);

// Get a session, creating it only for training screens that pass day_type.
r.get("/session", (req, res) => {
  const { date, day_type } = req.query;
  let sess = db.prepare("SELECT * FROM training_sessions WHERE user_id = ? AND date = ?").get(req.user.id, date);
  if (!sess && day_type) {
    const info = db.prepare("INSERT INTO training_sessions (user_id, date, day_type) VALUES (?, ?, ?)")
      .run(req.user.id, date, day_type);
    sess = db.prepare("SELECT * FROM training_sessions WHERE id = ?").get(info.lastInsertRowid);
  }
  if (!sess) return res.json(null);
  const sets = db.prepare("SELECT * FROM training_sets WHERE session_id = ? ORDER BY id ASC").all(sess.id);
  res.json({ ...sess, sets });
});

r.put("/session/:id", (req, res) => {
  const { completed, cardio_min, notes, day_type } = req.body || {};
  db.prepare(`UPDATE training_sessions SET
    completed = COALESCE(?, completed),
    cardio_min = COALESCE(?, cardio_min),
    notes = COALESCE(?, notes),
    day_type = COALESCE(?, day_type)
    WHERE id = ? AND user_id = ?`)
    .run(completed, cardio_min, notes, day_type, req.params.id, req.user.id);
  res.json(db.prepare("SELECT * FROM training_sessions WHERE id = ?").get(req.params.id));
});

r.post("/session/:id/set", (req, res) => {
  const sess = db.prepare("SELECT id FROM training_sessions WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!sess) return res.status(404).json({ error: "not_found" });
  const { exercise_id, exercise_name, set_number, weight_kg, reps } = req.body || {};
  const info = db.prepare(
    "INSERT INTO training_sets (session_id, exercise_id, exercise_name, set_number, weight_kg, reps) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(sess.id, exercise_id, exercise_name, set_number, weight_kg, reps);
  res.json(db.prepare("SELECT * FROM training_sets WHERE id = ?").get(info.lastInsertRowid));
});

r.put("/set/:id", (req, res) => {
  const set = db.prepare(`
    SELECT ts.id
    FROM training_sets ts
    JOIN training_sessions s ON s.id = ts.session_id
    WHERE ts.id = ? AND s.user_id = ?
  `).get(req.params.id, req.user.id);
  if (!set) return res.status(404).json({ error: "not_found" });

  const { weight_kg, reps } = req.body || {};
  db.prepare(`
    UPDATE training_sets
    SET weight_kg = ?, reps = ?
    WHERE id = ?
  `).run(weight_kg ?? null, reps ?? null, set.id);

  res.json(db.prepare("SELECT * FROM training_sets WHERE id = ?").get(set.id));
});

r.delete("/set/:id", (req, res) => {
  db.prepare(`DELETE FROM training_sets WHERE id = ? AND session_id IN (SELECT id FROM training_sessions WHERE user_id = ?)`)
    .run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// PR history for an exercise
r.get("/exercise/:exId/history", (req, res) => {
  const rows = db.prepare(
    `SELECT s.date, ts.weight_kg, ts.reps, ts.set_number
     FROM training_sets ts
     JOIN training_sessions s ON s.id = ts.session_id
     WHERE s.user_id = ? AND ts.exercise_id = ?
     ORDER BY s.date DESC, ts.set_number ASC
     LIMIT 60`
  ).all(req.user.id, req.params.exId);
  res.json(rows);
});

export default r;
