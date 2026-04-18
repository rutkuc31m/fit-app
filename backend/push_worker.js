import webpush from "web-push";
import cron from "node-cron";
import db from "./db.js";
import { QUOTES } from "./quotes.js";

// ─── VAPID config ───
// Keys live ONLY in VM env (systemd drop-in). No fallbacks in source.
// Generate: npx web-push generate-vapid-keys
export const VAPID_PUBLIC  = process.env.FIT_VAPID_PUBLIC;
const VAPID_PRIVATE = process.env.FIT_VAPID_PRIVATE;
const VAPID_SUBJECT = process.env.FIT_VAPID_SUBJECT || "mailto:admin@rutkuc.com";

if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
  throw new Error("FIT_VAPID_PUBLIC and FIT_VAPID_PRIVATE env vars required — set via systemd drop-in");
}

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

// ─── Send helpers ───

export async function sendToSubscription(row, payload) {
  const sub = {
    endpoint: row.endpoint,
    keys: { p256dh: row.p256dh, auth: row.auth }
  };
  try {
    await webpush.sendNotification(sub, payload);
    return { ok: true };
  } catch (e) {
    // 404/410 → subscription gone, prune
    if (e.statusCode === 404 || e.statusCode === 410) {
      db.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").run(row.endpoint);
    }
    return { ok: false, err: e.statusCode || e.message };
  }
}

const randomQuote = () => QUOTES[Math.floor(Math.random() * QUOTES.length)];

export async function sendDailyPushToAll() {
  const subs = db.prepare("SELECT * FROM push_subscriptions").all();
  if (!subs.length) return { sent: 0, failed: 0 };
  // Group by user so each user gets ONE random quote (same across their devices)
  const byUser = new Map();
  subs.forEach((s) => {
    if (!byUser.has(s.user_id)) byUser.set(s.user_id, []);
    byUser.get(s.user_id).push(s);
  });
  let sent = 0, failed = 0;
  for (const [, userSubs] of byUser) {
    const { q, a } = randomQuote();
    const payload = JSON.stringify({
      title: "Fit · Daily push",
      body: `"${q}" — ${a}`,
      url: "/today"
    });
    const results = await Promise.all(userSubs.map((s) => sendToSubscription(s, payload)));
    results.forEach((r) => r.ok ? sent++ : failed++);
  }
  console.log(`[push] daily sent=${sent} failed=${failed}`);
  return { sent, failed };
}

// ─── Weekly recap (Sunday) ───

function computeWeeklyRecap(userId) {
  const today = new Date();
  const toStr = today.toISOString().slice(0, 10);
  const from = new Date(today.getTime() - 6 * 86400000).toISOString().slice(0, 10);

  const logs = db.prepare(
    "SELECT date, weight_kg FROM daily_logs WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date ASC"
  ).all(userId, from, toStr);
  const weights = logs.map((l) => l.weight_kg).filter((w) => w != null);
  const weightDelta = weights.length >= 2 ? weights[weights.length - 1] - weights[0] : null;

  const kcalRows = db.prepare(`
    SELECT m.date, COALESCE(SUM(mi.kcal), 0) AS kcal
    FROM meals m LEFT JOIN meal_items mi ON mi.meal_id = m.id
    WHERE m.user_id = ? AND m.date >= ? AND m.date <= ?
    GROUP BY m.date
  `).all(userId, from, toStr);
  const avgKcal = kcalRows.length ? Math.round(kcalRows.reduce((a, r) => a + r.kcal, 0) / kcalRows.length) : 0;
  const daysLogged = kcalRows.length;

  return { weightDelta, avgKcal, daysLogged };
}

export async function sendWeeklyRecapToAll() {
  const subs = db.prepare("SELECT * FROM push_subscriptions").all();
  if (!subs.length) return { sent: 0, failed: 0 };
  const byUser = new Map();
  subs.forEach((s) => {
    if (!byUser.has(s.user_id)) byUser.set(s.user_id, []);
    byUser.get(s.user_id).push(s);
  });
  let sent = 0, failed = 0;
  for (const [userId, userSubs] of byUser) {
    const r = computeWeeklyRecap(userId);
    const delta = r.weightDelta == null ? "—" : `${r.weightDelta > 0 ? "+" : ""}${r.weightDelta.toFixed(1)}kg`;
    const body = `Week: ${delta} · avg ${r.avgKcal} kcal · ${r.daysLogged}/7 days logged`;
    const payload = JSON.stringify({
      title: "Fit · Weekly recap",
      body,
      url: "/progress"
    });
    const results = await Promise.all(userSubs.map((s) => sendToSubscription(s, payload)));
    results.forEach((r) => r.ok ? sent++ : failed++);
  }
  console.log(`[push] weekly recap sent=${sent} failed=${failed}`);
  return { sent, failed };
}

// ─── Scheduler: pick random minute 07:00–21:00 each day, fire once ───

let scheduledTimer = null;
let scheduledForDate = null;

const pickRandomMinute = () => {
  const HOUR_START = 7;
  const HOUR_END = 21; // last min = 20:59
  const total = (HOUR_END - HOUR_START) * 60;
  const offset = Math.floor(Math.random() * total);
  return { h: HOUR_START + Math.floor(offset / 60), m: offset % 60 };
};

function scheduleTodayPush() {
  const todayStr = new Date().toISOString().slice(0, 10);
  if (scheduledForDate === todayStr) return; // already scheduled
  if (scheduledTimer) clearTimeout(scheduledTimer);

  const { h, m } = pickRandomMinute();
  const now = new Date();
  const fire = new Date();
  fire.setHours(h, m, 0, 0);
  const msUntil = fire.getTime() - now.getTime();

  if (msUntil < 0) {
    console.log(`[push] today ${todayStr} target ${h}:${m} already passed — skip until tomorrow`);
    scheduledForDate = todayStr;
    return;
  }

  console.log(`[push] daily scheduled for ${todayStr} at ${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")} (${Math.round(msUntil/60000)} min)`);
  scheduledForDate = todayStr;
  scheduledTimer = setTimeout(() => {
    sendDailyPushToAll().catch(console.error);
  }, msUntil);
}

export function startPushScheduler() {
  // On boot: schedule today (if time remaining)
  scheduleTodayPush();
  // Daily at 00:05 local VM time: roll random for new day
  cron.schedule("5 0 * * *", () => {
    scheduledForDate = null;
    scheduleTodayPush();
  });
  // Weekly recap every Sunday 19:00 VM time
  cron.schedule("0 19 * * 0", () => {
    sendWeeklyRecapToAll().catch(console.error);
  });
  console.log("[push] scheduler started");
}
