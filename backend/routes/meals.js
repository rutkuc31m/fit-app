import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../auth.js";

const r = Router();
r.use(requireAuth);

const cleanNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const cleanEatenPct = (value) => {
  const n = cleanNumber(value, 100);
  return Math.max(0, Math.min(100, n));
};

// List meals (with items) for a date
r.get("/", (req, res) => {
  const { date } = req.query;
  const meals = db.prepare("SELECT * FROM meals WHERE user_id = ? AND date = ? ORDER BY time ASC").all(req.user.id, date);
  const getItems = db.prepare("SELECT * FROM meal_items WHERE meal_id = ? ORDER BY id ASC");
  res.json(meals.map((m) => ({ ...m, items: getItems.all(m.id) })));
});

// Create meal
r.post("/", (req, res) => {
  const { date, time, name } = req.body || {};
  const info = db.prepare("INSERT INTO meals (user_id, date, time, name) VALUES (?, ?, ?, ?)")
    .run(req.user.id, date, time || null, name || null);
  res.json(db.prepare("SELECT * FROM meals WHERE id = ?").get(info.lastInsertRowid));
});

r.delete("/:id", (req, res) => {
  db.prepare("DELETE FROM meals WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// Add item to meal
r.post("/:mealId/items", (req, res) => {
  const meal = db.prepare("SELECT id FROM meals WHERE id = ? AND user_id = ?").get(req.params.mealId, req.user.id);
  if (!meal) return res.status(404).json({ error: "not_found" });
  const { barcode, name, amount_g, kcal, protein_g, carbs_g, fat_g, eaten_pct } = req.body || {};
  const info = db.prepare(
    `INSERT INTO meal_items (meal_id, barcode, name, amount_g, kcal, protein_g, carbs_g, fat_g, eaten_pct)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(meal.id, barcode || null, name, amount_g, kcal || 0, protein_g || 0, carbs_g || 0, fat_g || 0, cleanEatenPct(eaten_pct));
  res.json(db.prepare("SELECT * FROM meal_items WHERE id = ?").get(info.lastInsertRowid));
});

r.delete("/items/:itemId", (req, res) => {
  db.prepare(`DELETE FROM meal_items WHERE id = ? AND meal_id IN (SELECT id FROM meals WHERE user_id = ?)`)
    .run(req.params.itemId, req.user.id);
  res.json({ ok: true });
});

r.put("/items/:itemId", (req, res) => {
  const item = db.prepare(`
    SELECT mi.id
    FROM meal_items mi
    JOIN meals m ON m.id = mi.meal_id
    WHERE mi.id = ? AND m.user_id = ?
  `).get(req.params.itemId, req.user.id);
  if (!item) return res.status(404).json({ error: "not_found" });

  const { barcode, name, amount_g, kcal, protein_g, carbs_g, fat_g, eaten_pct } = req.body || {};
  db.prepare(`
    UPDATE meal_items
    SET barcode = ?, name = ?, amount_g = ?, kcal = ?, protein_g = ?, carbs_g = ?, fat_g = ?, eaten_pct = ?
    WHERE id = ?
  `).run(barcode || null, name, amount_g, kcal || 0, protein_g || 0, carbs_g || 0, fat_g || 0, cleanEatenPct(eaten_pct), item.id);

  res.json(db.prepare("SELECT * FROM meal_items WHERE id = ?").get(item.id));
});

export default r;
