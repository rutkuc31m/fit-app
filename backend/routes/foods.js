import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../auth.js";

const r = Router();
r.use(requireAuth);

const OFF_URL = (barcode) => `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`;
const CACHE_DAYS = 30;

r.get("/barcode/:code", async (req, res, next) => {
  const code = req.params.code.trim();
  try {
    const cached = db.prepare("SELECT * FROM foods_cache WHERE barcode = ?").get(code);
    const fresh = cached && (Date.now() - new Date(cached.fetched_at + "Z").getTime()) < CACHE_DAYS * 86400000;
    if (cached && fresh) return res.json({ source: "cache", ...cached });

    const resp = await fetch(OFF_URL(code), { headers: { "User-Agent": "fit.rutkuc.com/1.0" } });
    if (!resp.ok) return res.status(404).json({ error: "not_found" });
    const data = await resp.json();
    if (data.status !== 1) return res.status(404).json({ error: "not_found" });
    const p = data.product || {};
    const n = p.nutriments || {};
    const row = {
      barcode: code,
      name: p.product_name || p.generic_name || "",
      brand: p.brands || "",
      kcal_100g: n["energy-kcal_100g"] ?? (n["energy_100g"] ? n["energy_100g"] / 4.184 : null),
      protein_100g: n.proteins_100g ?? null,
      carbs_100g: n.carbohydrates_100g ?? null,
      fat_100g: n.fat_100g ?? null,
      raw_json: JSON.stringify({ product_name: p.product_name, brands: p.brands, nutriments: n }),
    };
    db.prepare(`INSERT INTO foods_cache (barcode, name, brand, kcal_100g, protein_100g, carbs_100g, fat_100g, raw_json, fetched_at)
      VALUES (@barcode, @name, @brand, @kcal_100g, @protein_100g, @carbs_100g, @fat_100g, @raw_json, datetime('now'))
      ON CONFLICT(barcode) DO UPDATE SET
        name = excluded.name, brand = excluded.brand,
        kcal_100g = excluded.kcal_100g, protein_100g = excluded.protein_100g,
        carbs_100g = excluded.carbs_100g, fat_100g = excluded.fat_100g,
        raw_json = excluded.raw_json, fetched_at = datetime('now')`).run(row);
    res.json({ source: "off", ...row });
  } catch (e) { next(e); }
});

// Recent unique items (for quick add from history)
r.get("/recent", (req, res) => {
  const rows = db.prepare(
    `SELECT name, barcode, MAX(kcal) AS kcal, MAX(protein_g) AS protein_g, MAX(carbs_g) AS carbs_g, MAX(fat_g) AS fat_g, MAX(amount_g) AS amount_g
     FROM meal_items WHERE meal_id IN (SELECT id FROM meals WHERE user_id = ?)
     GROUP BY name COLLATE NOCASE ORDER BY MAX(id) DESC LIMIT 30`
  ).all(req.user.id);
  res.json(rows);
});

export default r;
