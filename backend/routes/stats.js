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

const addDays = (s, days) => {
  const d = new Date(`${s}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const dateRange = (from, to) => {
  const days = [];
  for (let d = from; d <= to; d = addDays(d, 1)) days.push(d);
  return days;
};

const dayPlan = (date) => {
  const dow = new Date(`${date}T12:00:00`).getDay();
  return {
    1: { type: "A", eating: "OMAD" },
    2: { type: "rest", eating: "FAST" },
    3: { type: "B", eating: "OMAD" },
    4: { type: "rest", eating: "LOW" },
    5: { type: "C", eating: "OMAD" },
    6: { type: "rest", eating: "FAST" },
    0: { type: "rest", eating: "LOW" }
  }[dow];
};

const eatingTarget = (mode) => ({
  OMAD: { kcal: 1800, protein_g: 150 },
  LOW: { kcal: 1300, protein_g: 130 },
  FAST: { kcal: 0, protein_g: 0 }
}[mode] || { kcal: 0, protein_g: 0 });

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
  const trainingByDate = new Map(trainingRows.map((r) => [r.date, r]));
  const mealByDate = new Map(meals.map((r) => [r.date, r]));
  const days = dateRange(from, to);
  const plannedTrainingDates = days.filter((date) => dayPlan(date).type !== "rest");
  const nonFastDates = days.filter((date) => dayPlan(date).eating !== "FAST");
  const fastDates = days.filter((date) => dayPlan(date).eating === "FAST");

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
  const trainingDone = plannedTrainingDates.filter((date) => trainingByDate.get(date)?.completed).length;
  const weightDays = logs.filter((r) => r.weight_kg != null).length;
  const recoveryDays = logs.filter((r) => r.energy != null || r.hunger != null || r.headache != null).length;
  const hydrationDays = logs.filter((r) => (r.water_ml || 0) + (r.coffee_ml || 0) > 0).length;
  const mealDays = meals.length;
  const proteinDays = nonFastDates.filter((date) => {
    const meal = mealByDate.get(date);
    const target = eatingTarget(dayPlan(date).eating);
    return meal && meal.protein_g >= target.protein_g * 0.9;
  }).length;
  const calorieGuardrailDays = nonFastDates.filter((date) => {
    const meal = mealByDate.get(date);
    const target = eatingTarget(dayPlan(date).eating);
    return meal && meal.kcal > 0 && meal.kcal <= target.kcal * 1.15;
  }).length;
  const fastCleanDays = fastDates.filter((date) => (mealByDate.get(date)?.kcal || 0) <= 50).length;
  const fastBreachDays = fastDates.length - fastCleanDays;
  const mealConsistencyDenom = nonFastDates.length * 2 + fastDates.length;
  const mealConsistencyPct = mealConsistencyDenom
    ? Math.round(((proteinDays + calorieGuardrailDays + fastCleanDays) / mealConsistencyDenom) * 100)
    : null;
  const trainingAdherence = plannedTrainingDates.length ? trainingDone / plannedTrainingDates.length : 1;
  const adherencePct = Math.round((
    (weightDays / Math.max(1, days.length)) +
    ((mealConsistencyPct ?? 0) / 100) +
    trainingAdherence +
    (recoveryDays / Math.max(1, days.length)) +
    (hydrationDays / Math.max(1, days.length))
  ) / 5 * 100);
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
    training_planned: plannedTrainingDates.length,
    avg_energy: avgEnergy,
    avg_hunger: avgHunger,
    avg_headache: avgHeadache,
    recovery_days: recoveryDays,
    hydration_days: hydrationDays,
    protein_days: proteinDays,
    calorie_guardrail_days: calorieGuardrailDays,
    fast_clean_days: fastCleanDays,
    fast_breach_days: fastBreachDays,
    meal_consistency_pct: mealConsistencyPct,
    adherence_pct: adherencePct,
    latest_waist_cm: latestMeasurement?.waist_cm ?? null,
    waist_change: waistChange,
    signal
  });
});

export default r;
