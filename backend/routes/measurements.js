import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../auth.js";

const r = Router();
r.use(requireAuth);

r.get("/", (req, res) => {
  res.json(db.prepare("SELECT * FROM measurements WHERE user_id = ? ORDER BY date ASC").all(req.user.id));
});

r.post("/", (req, res) => {
  const { date, waist_cm, chest_cm, arm_cm, hip_cm, thigh_cm } = req.body || {};
  const info = db.prepare(
    "INSERT INTO measurements (user_id, date, waist_cm, chest_cm, arm_cm, hip_cm, thigh_cm) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(req.user.id, date, waist_cm, chest_cm, arm_cm, hip_cm, thigh_cm);
  res.json(db.prepare("SELECT * FROM measurements WHERE id = ?").get(info.lastInsertRowid));
});

r.delete("/:id", (req, res) => {
  db.prepare("DELETE FROM measurements WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
  res.json({ ok: true });
});

export default r;
