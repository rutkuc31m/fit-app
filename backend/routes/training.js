import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../auth.js";

const r = Router();
r.use(requireAuth);

// Get a session, creating it only for training screens that pass day_type.
r.get("/session", (req, res) => {
  const { date, day_type } = req.query;
  let sess = day_type
    ? db.prepare("SELECT * FROM training_sessions WHERE user_id = ? AND date = ? AND day_type = ? ORDER BY id DESC").get(req.user.id, date, day_type)
    : db.prepare("SELECT * FROM training_sessions WHERE user_id = ? AND date = ? ORDER BY id DESC").get(req.user.id, date);
  if (!sess && day_type) {
    sess = db.prepare("SELECT * FROM training_sessions WHERE user_id = ? AND date = ? ORDER BY id DESC").get(req.user.id, date);
    if (sess) {
      db.prepare("UPDATE training_sessions SET day_type = ? WHERE id = ? AND user_id = ?").run(day_type, sess.id, req.user.id);
      sess = db.prepare("SELECT * FROM training_sessions WHERE id = ?").get(sess.id);
    }
  }
  if (!sess && day_type) {
    const info = db.prepare("INSERT INTO training_sessions (user_id, date, day_type) VALUES (?, ?, ?)")
      .run(req.user.id, date, day_type);
    sess = db.prepare("SELECT * FROM training_sessions WHERE id = ?").get(info.lastInsertRowid);
  }
  if (!sess) return res.json(null);
  const sets = db.prepare("SELECT * FROM training_sets WHERE session_id = ? ORDER BY id ASC").all(sess.id);
  res.json({ ...sess, sets });
});

r.get("/sessions", (req, res) => {
  const { day_type, until, limit } = req.query;
  const maxRows = Math.min(Math.max(Number(limit) || 14, 1), 60);
  const rows = day_type
    ? db.prepare(`
        SELECT *
        FROM training_sessions
        WHERE user_id = ? AND day_type = ? AND date <= COALESCE(?, date)
        ORDER BY date DESC, id DESC
        LIMIT ?
      `).all(req.user.id, day_type, until || null, maxRows)
    : db.prepare(`
        SELECT *
        FROM training_sessions
        WHERE user_id = ? AND date <= COALESCE(?, date)
        ORDER BY date DESC, id DESC
        LIMIT ?
      `).all(req.user.id, until || null, maxRows);

  const setsBySession = new Map();
  if (rows.length > 0) {
    const placeholders = rows.map(() => "?").join(",");
    const sets = db.prepare(`
      SELECT *
      FROM training_sets
      WHERE session_id IN (${placeholders})
      ORDER BY id ASC
    `).all(...rows.map((row) => row.id));
    sets.forEach((set) => {
      if (!setsBySession.has(set.session_id)) setsBySession.set(set.session_id, []);
      setsBySession.get(set.session_id).push(set);
    });
  }

  res.json(rows.map((row) => ({ ...row, sets: setsBySession.get(row.id) || [] })));
});

const normalizeActivityType = (type) => {
  const value = String(type || "").trim().toLowerCase();
  return value === "football" ? value : null;
};

r.get("/activity", (req, res) => {
  const { date } = req.query;
  const type = normalizeActivityType(req.query.type);
  if (!date) return res.status(400).json({ error: "date_required" });
  if (!type) return res.status(400).json({ error: "type_invalid" });

  const row = db.prepare(`
    SELECT id, date, type, minutes, kcal, created_at, updated_at
    FROM activity_logs
    WHERE user_id = ? AND date = ? AND type = ?
  `).get(req.user.id, date, type);

  res.json(row || null);
});

r.put("/activity", (req, res) => {
  const { date } = req.body || {};
  const type = normalizeActivityType(req.body?.type);
  const minutes = Math.max(0, Math.min(600, Math.round(Number(req.body?.minutes) || 0)));
  const kcal = Math.max(0, Math.min(5000, Math.round(Number(req.body?.kcal) || 0)));

  if (!date) return res.status(400).json({ error: "date_required" });
  if (!type) return res.status(400).json({ error: "type_invalid" });

  db.prepare(`
    INSERT INTO activity_logs (user_id, date, type, minutes, kcal, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id, date, type) DO UPDATE SET
      minutes = excluded.minutes,
      kcal = excluded.kcal,
      updated_at = datetime('now')
  `).run(req.user.id, date, type, minutes, kcal);

  const row = db.prepare(`
    SELECT id, date, type, minutes, kcal, created_at, updated_at
    FROM activity_logs
    WHERE user_id = ? AND date = ? AND type = ?
  `).get(req.user.id, date, type);

  res.json(row);
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
  const sess = db.prepare("SELECT id, date FROM training_sessions WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!sess) return res.status(404).json({ error: "not_found" });
  const { exercise_id, exercise_name, set_number, weight_kg, reps, logged_date } = req.body || {};
  const logDate = String(logged_date || sess.date || "").slice(0, 10) || sess.date;
  const info = db.prepare(
    "INSERT INTO training_sets (session_id, exercise_id, exercise_name, set_number, weight_kg, reps, logged_date, logged_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))"
  ).run(sess.id, exercise_id, exercise_name, set_number, weight_kg, reps, logDate);
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
  const exId = String(req.params.exId || "").trim();
  if (!exId) return res.json([]);
  const rows = db.prepare(
    `SELECT s.date, ts.weight_kg, ts.reps, ts.set_number
     FROM training_sets ts
     JOIN training_sessions s ON s.id = ts.session_id
     WHERE s.user_id = ? AND (
       ts.exercise_id = ?
       OR ts.exercise_id LIKE ?
     )
     ORDER BY s.date DESC, ts.id DESC
     LIMIT 60`
  ).all(req.user.id, exId, `%|%|${exId}`);
  res.json(rows);
});

export default r;
