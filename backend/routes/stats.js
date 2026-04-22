import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../auth.js";

const r = Router();
r.use(requireAuth);

const avg = (rows, key) => {
  const vals = rows.map((r) => r[key]).filter((v) => v != null);
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + Number(b), 0) / vals.length;
};

const prevDate = (s) => {
  const d = new Date(s); d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

// GET /api/stats/streaks — current streaks for weight-log / fast / training
r.get("/streaks", (req, res) => {
  const uid = req.user.id;
  const today = new Date().toISOString().slice(0, 10);

  // Weight streak: consecutive days ending today with weight_kg logged
  const weightRows = db.prepare(
    "SELECT date FROM daily_logs WHERE user_id = ? AND weight_kg IS NOT NULL ORDER BY date DESC"
  ).all(uid).map((r) => r.date);
  let weightStreak = 0; let cur = today;
  for (const d of weightRows) {
    if (d !== cur) break;
    weightStreak += 1; cur = prevDate(cur);
  }

  // Fast streak: consecutive days with fasting_type set
  const fastRows = db.prepare(
    "SELECT date FROM daily_logs WHERE user_id = ? AND fasting_type IS NOT NULL AND fasting_type != '' ORDER BY date DESC"
  ).all(uid).map((r) => r.date);
  let fastStreak = 0; cur = today;
  for (const d of fastRows) {
    if (d !== cur) break;
    fastStreak += 1; cur = prevDate(cur);
  }

  // Training streak: consecutive training-scheduled days completed.
  // Simple version: consecutive days with completed=1 session (non-training days don't break streak)
  const sessionRows = db.prepare(
    "SELECT date, completed FROM training_sessions WHERE user_id = ? ORDER BY date DESC"
  ).all(uid);
  let trainingStreak = 0;
  for (const s of sessionRows) {
    if (!s.completed) break;
    trainingStreak += 1;
  }

  res.json({ weightStreak, fastStreak, trainingStreak });
});

// GET /api/stats/weekly-review?from=YYYY-MM-DD&to=YYYY-MM-DD
r.get("/weekly-review", (req, res) => {
  const uid = req.user.id;
  const to = req.query.to || new Date().toISOString().slice(0, 10);
  const from = req.query.from || prevDate(prevDate(prevDate(prevDate(prevDate(prevDate(to))))));
  const prevTo = prevDate(from);
  const prevFromDate = new Date(`${from}T12:00:00`);
  prevFromDate.setDate(prevFromDate.getDate() - 7);
  const prevFrom = prevFromDate.toISOString().slice(0, 10);

  const logs = db.prepare(
    "SELECT * FROM daily_logs WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date ASC"
  ).all(uid, from, to);
  const prevLogs = db.prepare(
    "SELECT * FROM daily_logs WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date ASC"
  ).all(uid, prevFrom, prevTo);

  const meals = db.prepare(`
    SELECT m.date,
      COALESCE(SUM(mi.kcal), 0) AS kcal,
      COALESCE(SUM(mi.protein_g), 0) AS protein_g
    FROM meals m
    LEFT JOIN meal_items mi ON mi.meal_id = m.id
    WHERE m.user_id = ? AND m.date >= ? AND m.date <= ?
    GROUP BY m.date
    ORDER BY m.date ASC
  `).all(uid, from, to);

  const trainingRows = db.prepare(
    "SELECT date, completed FROM training_sessions WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date ASC"
  ).all(uid, from, to);

  const latestMeasurement = db.prepare(
    "SELECT * FROM measurements WHERE user_id = ? AND date <= ? ORDER BY date DESC, id DESC LIMIT 1"
  ).get(uid, to) || null;
  const previousMeasurement = db.prepare(
    "SELECT * FROM measurements WHERE user_id = ? AND date < ? ORDER BY date DESC, id DESC LIMIT 1"
  ).get(uid, from) || null;

  const avgWeight = avg(logs, "weight_kg");
  const prevAvgWeight = avg(prevLogs, "weight_kg");
  const avgKcal = avg(meals, "kcal");
  const avgProtein = avg(meals, "protein_g");
  const avgEnergy = avg(logs, "energy");
  const avgHunger = avg(logs, "hunger");
  const avgHeadache = avg(logs, "headache");
  const trainingDone = trainingRows.filter((r) => r.completed).length;
  const weightDays = logs.filter((r) => r.weight_kg != null).length;
  const mealDays = meals.length;
  const waistChange =
    latestMeasurement?.waist_cm != null && previousMeasurement?.waist_cm != null
      ? latestMeasurement.waist_cm - previousMeasurement.waist_cm
      : null;

  let signal = "keep_going";
  if ((avgHeadache != null && avgHeadache >= 3) || (avgEnergy != null && avgEnergy <= 2)) signal = "recover";
  else if (avgWeight != null && prevAvgWeight != null && avgWeight > prevAvgWeight + 0.3 && mealDays >= 4) signal = "audit";
  else if (trainingDone >= 3 && weightDays >= 5 && (avgEnergy == null || avgEnergy >= 3)) signal = "strong";

  res.json({
    from,
    to,
    avg_weight: avgWeight,
    prev_avg_weight: prevAvgWeight,
    weight_delta: avgWeight != null && prevAvgWeight != null ? avgWeight - prevAvgWeight : null,
    weight_days: weightDays,
    meal_days: mealDays,
    avg_kcal: avgKcal,
    avg_protein_g: avgProtein,
    training_done: trainingDone,
    training_planned: trainingRows.length,
    avg_energy: avgEnergy,
    avg_hunger: avgHunger,
    avg_headache: avgHeadache,
    latest_waist_cm: latestMeasurement?.waist_cm ?? null,
    waist_change: waistChange,
    signal
  });
});

export default r;
