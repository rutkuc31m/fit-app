import { Router } from "express";
import bcrypt from "bcryptjs";
import db from "../db.js";
import { signToken, requireAuth } from "../auth.js";

const r = Router();

r.post("/register", (req, res) => {
  const { email, password, name, lang } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "missing_fields" });
  const exists = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (exists) return res.status(409).json({ error: "email_taken" });
  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare("INSERT INTO users (email, password_hash, name, lang) VALUES (?, ?, ?, ?)")
    .run(email, hash, name || null, lang || "en");
  const user = db.prepare("SELECT id, email, name, lang, start_date FROM users WHERE id = ?").get(info.lastInsertRowid);
  res.json({ user, token: signToken(user) });
});

r.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  const u = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!u || !bcrypt.compareSync(password || "", u.password_hash))
    return res.status(401).json({ error: "bad_credentials" });
  const { password_hash, ...user } = u;
  res.json({ user, token: signToken(user) });
});

r.get("/me", requireAuth, (req, res) => {
  const u = db.prepare("SELECT id, email, name, lang, start_date, start_weight, target_weight, height_cm FROM users WHERE id = ?").get(req.user.id);
  res.json(u);
});

r.put("/me", requireAuth, (req, res) => {
  const allowed = ["name", "lang", "start_date", "start_weight", "target_weight", "height_cm"];
  const fields = allowed.filter((k) => k in req.body);
  if (!fields.length) return res.json({ ok: true });
  const sets = fields.map((k) => `${k} = ?`).join(", ");
  const vals = fields.map((k) => req.body[k]);
  db.prepare(`UPDATE users SET ${sets} WHERE id = ?`).run(...vals, req.user.id);
  const u = db.prepare("SELECT id, email, name, lang, start_date, start_weight, target_weight, height_cm FROM users WHERE id = ?").get(req.user.id);
  res.json(u);
});

export default r;
