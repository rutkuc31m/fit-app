import { Router } from "express";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import db from "../db.js";
import { requireAuth } from "../auth.js";

const r = Router();
r.use(requireAuth);

const OFF_URL = (barcode) => `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`;
const CACHE_DAYS = 30;
const PHOTO_DIR = process.env.FIT_PHOTO_DIR || "./data/photos";

const clampMacro = (value, max) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.min(max, +n.toFixed(1));
};
const normalizeNutrition = (item) => {
  if (!item || typeof item !== "object") return null;
  return {
    ...item,
    kcal_100g: clampMacro(item.kcal_100g, 1200),
    protein_100g: clampMacro(item.protein_100g, 100),
    carbs_100g: clampMacro(item.carbs_100g, 100),
    fat_100g: clampMacro(item.fat_100g, 100)
  };
};
const hasUsableMacros = (item = {}) =>
  item.kcal_100g != null && item.kcal_100g > 0 &&
  ["protein_100g", "carbs_100g", "fat_100g"].every((field) => item[field] != null && item[field] >= 0) &&
  (item.protein_100g + item.carbs_100g + item.fat_100g) > 0;
const parseAiJson = (text) => {
  const match = String(text || "").match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
};

r.post("/meal-photo", (req, res) => {
  const { data_url, date } = req.body || {};
  const photoDate = date || new Date().toISOString().slice(0, 10);
  if (!data_url || !data_url.startsWith("data:image/")) return res.status(400).json({ error: "bad_data" });
  const m = data_url.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!m) return res.status(400).json({ error: "bad_format" });
  const ext = m[1] === "jpeg" ? "jpg" : m[1];
  const buf = Buffer.from(m[2], "base64");
  const userDir = join(PHOTO_DIR, String(req.user.id), "food");
  if (!existsSync(userDir)) mkdirSync(userDir, { recursive: true });
  const fname = `meal_${photoDate}_${Date.now()}.${ext}`;
  writeFileSync(join(userDir, fname), buf);
  const relPath = `/photos/${req.user.id}/food/${fname}`;
  const info = db.prepare("INSERT INTO meal_photos (user_id, date, path) VALUES (?, ?, ?)")
    .run(req.user.id, photoDate, relPath);
  res.json({ id: info.lastInsertRowid, date: photoDate, path: relPath });
});

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
    const row = normalizeNutrition({
      barcode: code,
      name: p.product_name || p.generic_name || "",
      brand: p.brands || "",
      kcal_100g: n["energy-kcal_100g"] ?? (n["energy_100g"] ? n["energy_100g"] / 4.184 : null),
      protein_100g: n.proteins_100g ?? null,
      carbs_100g: n.carbohydrates_100g ?? null,
      fat_100g: n.fat_100g ?? null,
      raw_json: JSON.stringify({ product_name: p.product_name, brands: p.brands, nutriments: n }),
    });
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

// Photo → Gemini vision → nutrition per 100g
r.post("/analyze-photo", async (req, res, next) => {
  try {
    const { image } = req.body || {};
    if (!image || typeof image !== "string") return res.status(400).json({ error: "no_image" });
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: "ai_not_configured" });

    const prompt = `Analyze this food photo. If nutrition label visible, read it. Otherwise use your knowledge of the identified product (brand + name) to provide typical per-100g macros.
CRITICAL: kcal_100g, protein_100g, carbs_100g, fat_100g MUST be non-zero positive numbers. Never return 0 or null for macros — always estimate based on product category if exact values unknown (e.g. butter cookies ~470kcal, 6g protein, 70g carbs, 18g fat per 100g).
Respond with ONLY a JSON object, no prose, no markdown fences:
{"name": string, "brand": string|null, "kcal_100g": number, "protein_100g": number, "carbs_100g": number, "fat_100g": number, "confidence": "high"|"medium"|"low"}
If the photo contains no food at all, return {"error": "not_food"}.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${encodeURIComponent(apiKey)}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: "image/jpeg", data: image } },
            { text: prompt }
          ]
        }],
        generationConfig: { temperature: 0.2, responseMimeType: "application/json" }
      })
    });
    if (!resp.ok) {
      const txt = await resp.text();
      return res.status(502).json({ error: "ai_error", detail: txt.slice(0, 300) });
    }
    const data = await resp.json();
    const text = ((data.candidates?.[0]?.content?.parts || []).map((p) => p.text).join("") || "").trim();
    const parsedRaw = parseAiJson(text);
    if (!parsedRaw) return res.status(422).json({ error: "ai_parse_failed", raw: text.slice(0, 300) });
    const parsed = normalizeNutrition(parsedRaw);
    if (parsed.error) return res.status(404).json({ error: parsed.error });
    if (!hasUsableMacros(parsed)) return res.status(422).json({ error: "ai_bad_macros" });
    console.log("[gemini.food]", JSON.stringify({ name: parsed.name || null, brand: parsed.brand || null, confidence: parsed.confidence || null }));
    res.json({ source: "ai", ...parsed });
  } catch (e) { next(e); }
});

// Text search: OFF products + Gemini fallback for missing macros on selection
r.get("/search", async (req, res, next) => {
  const q = (req.query.q || "").trim();
  if (q.length < 2) return res.json([]);
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=10&fields=code,product_name,brands,nutriments`;
    const resp = await fetch(url, { headers: { "User-Agent": "fit.rutkuc.com/1.0" } });
    if (!resp.ok) return res.json([]);
    const data = await resp.json();
    const items = (data.products || []).map((p) => {
      const n = p.nutriments || {};
      const kcal = n["energy-kcal_100g"] ?? (n["energy_100g"] ? n["energy_100g"] / 4.184 : null);
      return normalizeNutrition({
        barcode: p.code || null,
        name: p.product_name || "",
        brand: p.brands || "",
        kcal_100g: kcal ?? null,
        protein_100g: n.proteins_100g ?? null,
        carbs_100g: n.carbohydrates_100g ?? null,
        fat_100g: n.fat_100g ?? null,
      });
    }).filter((x) => x.name);
    res.json(items);
  } catch (e) { next(e); }
});

// Gemini text lookup — fill macros by product name when OFF missing
r.post("/lookup-name", async (req, res, next) => {
  try {
    const { name, brand } = req.body || {};
    if (!name) return res.status(400).json({ error: "no_name" });
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: "ai_not_configured" });
    const prompt = `Product: ${[brand, name].filter(Boolean).join(" — ")}
Return ONLY JSON with typical per-100g macros. Non-zero positive numbers. No prose, no fences:
{"kcal_100g": number, "protein_100g": number, "carbs_100g": number, "fat_100g": number, "confidence": "high"|"medium"|"low"}`;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${encodeURIComponent(apiKey)}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, responseMimeType: "application/json" }
      })
    });
    if (!resp.ok) {
      const txt = await resp.text();
      return res.status(502).json({ error: "ai_error", detail: txt.slice(0, 300) });
    }
    const data = await resp.json();
    const text = ((data.candidates?.[0]?.content?.parts || []).map((p) => p.text).join("") || "").trim();
    const parsed = normalizeNutrition(parseAiJson(text));
    if (!parsed) return res.status(422).json({ error: "ai_parse_failed", raw: text.slice(0, 300) });
    if (!hasUsableMacros(parsed)) return res.status(422).json({ error: "ai_bad_macros" });
    res.json({ source: "ai", name, brand: brand || null, ...parsed });
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
