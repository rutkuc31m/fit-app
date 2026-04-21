import cron from "node-cron";
import db from "../db.js";
import { sendToSubscription } from "../push_worker.js";
import { getScheduleForDate } from "../lib/dailySchedule.js";

const TZ = "Europe/Berlin";

const PREF_BY_CATEGORY = {
  checkpoint: "workout_enabled",
  training: "workout_enabled",
  cardio: "cardio_enabled",
  activity: "routine_enabled",
  nutrition: "meal_enabled",
  supplement: "supp_enabled",
  routine: "routine_enabled",
  family: "family_enabled",
  sleep: "sleep_enabled"
};

function berlinParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(now).reduce((acc, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`
  };
}

const itemId = (item) => `${item.time}|${item.category}|${item.action}`;

function prefsAllow(prefs, item) {
  const field = PREF_BY_CATEGORY[item.category];
  if (!field) return true;
  return !prefs || prefs[field] !== 0;
}

async function sendScheduleItem(date, item, byUser) {
  const payload = JSON.stringify({
    title: item.action,
    body: item.details || "",
    tag: `schedule-${date}-${itemId(item)}`,
    data: { type: "schedule", date, itemId: itemId(item), category: item.category },
    url: "/today"
  });

  let sentUsers = 0;
  for (const [userId, userSubs] of byUser) {
    const prefs = db.prepare("SELECT * FROM notification_prefs WHERE user_id = ?").get(userId);
    if (!prefsAllow(prefs, item)) continue;

    const delivery = db.prepare(
      "SELECT 1 FROM push_reminder_deliveries WHERE user_id = ? AND date = ? AND item_id = ?"
    ).get(userId, date, itemId(item));
    if (delivery) continue;

    const results = await Promise.all(userSubs.map((s) => sendToSubscription(s, payload)));
    if (results.some((r) => r.ok)) {
      db.prepare("INSERT OR IGNORE INTO push_reminder_deliveries (user_id, date, item_id) VALUES (?, ?, ?)")
        .run(userId, date, itemId(item));
      sentUsers += 1;
    }
  }

  if (sentUsers) {
    console.log(`[push] schedule reminder sent: ${date} ${item.time} ${item.category} ${item.action} users=${sentUsers}`);
  }
}

export async function sendDueScheduleReminders(now = new Date()) {
  const { date, time } = berlinParts(now);
  const dueItems = getScheduleForDate(date).filter((item) => item.time === time);
  if (!dueItems.length) return { due: 0, sent: 0 };

  const subs = db.prepare("SELECT * FROM push_subscriptions").all();
  if (!subs.length) return { due: dueItems.length, sent: 0 };

  const byUser = new Map();
  subs.forEach((s) => {
    if (!byUser.has(s.user_id)) byUser.set(s.user_id, []);
    byUser.get(s.user_id).push(s);
  });

  for (const item of dueItems) {
    await sendScheduleItem(date, item, byUser);
  }

  return { due: dueItems.length, sent: byUser.size };
}

export function startReminderCrons() {
  cron.schedule("* * * * *", () => sendDueScheduleReminders().catch(console.error), { timezone: TZ });
  console.log("[push] schedule reminder cron registered (every minute, Berlin)");
}
