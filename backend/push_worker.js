import webpush from "web-push";
import cron from "node-cron";
import db from "./db.js";
import { QUOTES } from "./quotes.js";

// ─── VAPID config ───
// Run `node -e "console.log(require('web-push').generateVAPIDKeys())"` to generate.
// Keep PRIVATE key in VM env. PUBLIC key can be hardcoded or env.
export const VAPID_PUBLIC  = process.env.FIT_VAPID_PUBLIC  || "BK1GzZm3tJk4i3jFhWXhCGgHs07n449o-QrejjxNsnY-ZlMDnpnlVR8SMF6Y_Xdads2yy9BNmE6_H_BOgPyggbc";
const VAPID_PRIVATE = process.env.FIT_VAPID_PRIVATE || "rQYR7JkW0dpZYyqd67_l74mmnHSWV_owQVZhx35Wx6k";
const VAPID_SUBJECT = process.env.FIT_VAPID_SUBJECT || "mailto:admin@rutkuc.com";

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
  console.log("[push] scheduler started");
}
