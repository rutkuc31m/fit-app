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

r.get("/favorite-machines", (req, res) => {
  const rows = db.prepare(`
    SELECT machine_id, code, name, series, area, muscles, created_at, updated_at
    FROM favorite_machines
    WHERE user_id = ?
    ORDER BY updated_at DESC, id DESC
  `).all(req.user.id).map((row) => ({
    ...row,
    muscles: row.muscles ? JSON.parse(row.muscles) : []
  }));
  res.json(rows);
});

r.post("/favorite-machines", (req, res) => {
  const { machine_id, code, name, series, area, muscles } = req.body || {};
  if (!machine_id) return res.status(400).json({ error: "machine_id_required" });
  db.prepare(`
    INSERT INTO favorite_machines (user_id, machine_id, code, name, series, area, muscles, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id, machine_id) DO UPDATE SET
      code = excluded.code,
      name = excluded.name,
      series = excluded.series,
      area = excluded.area,
      muscles = excluded.muscles,
      updated_at = datetime('now')
  `).run(
    req.user.id,
    machine_id,
    code || null,
    name || null,
    series || null,
    area || null,
    JSON.stringify(Array.isArray(muscles) ? muscles : [])
  );

  const row = db.prepare(`
    SELECT machine_id, code, name, series, area, muscles, created_at, updated_at
    FROM favorite_machines
    WHERE user_id = ? AND machine_id = ?
  `).get(req.user.id, machine_id);

  res.json({ ...row, muscles: row.muscles ? JSON.parse(row.muscles) : [] });
});

r.delete("/favorite-machines/:machineId", (req, res) => {
  db.prepare("DELETE FROM favorite_machines WHERE user_id = ? AND machine_id = ?").run(req.user.id, req.params.machineId);
  res.json({ ok: true });
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
