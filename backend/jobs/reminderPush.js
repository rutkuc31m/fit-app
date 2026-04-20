import cron from "node-cron";
import db from "../db.js";
import { sendToSubscription } from "../push_worker.js";

const REMINDERS = [
  { cron: "10 7 * * 1",      type: "checkin",      cat: "workout",  title: "Check-in zamanı",  body: "Tartıl + 3 fotoğraf 📸" },
  { cron: "0 12 * * 1-5",    type: "walk",         cat: "meal",     title: "Öğle yürüyüşü",   body: "15-20dk dışarı çık 🚶",               dayCheck: "weekday" },
  { cron: "0 15 * * 1-5",    type: "water",        cat: "meal",     title: "Su zamanı",        body: "500ml su iç 💧",                      dayCheck: "weekday" },
  { cron: "45 18 * * 1,3,5", type: "gym_prep",     cat: "workout",  title: "Gym'e 15dk",       body: "Çantayı hazırla 💪",                  dayCheck: "training" },
  { cron: "30 19 * * 1,3,5", type: "shake",        cat: "workout",  title: "Post-workout",     body: "30g whey + su 🥤",                    dayCheck: "training" },
  { cron: "0 20 * * 1,3,5",  type: "omad",         cat: "meal",     title: "OMAD zamanı",      body: "Protein önce, sonra sebze 🍽️",        dayCheck: "eating" },
  { cron: "0 20 * * 2,6",    type: "fast_hydrate", cat: "meal",     title: "Oruç devam",       body: "Hidrasyon bol tut 💧",                dayCheck: "fast" },
  { cron: "0 20 * * 0,4",    type: "low_meal",     cat: "meal",     title: "Düşük kalori",     body: "Tek öğün, ~1300 kcal 🍽️",            dayCheck: "low" },
  { cron: "0 21 * * *",      type: "supp_pm",      cat: "supp",     title: "Supplement",       body: "Magnesium + B12 💊" },
  { cron: "45 22 * * *",     type: "wind_down",    cat: "supp",     title: "Uyku hazırlığı",   body: "15dk — ekranı bırak 😴" }
];

const eatingPattern = { 1: "OMAD", 2: "FAST", 3: "OMAD", 4: "LOW", 5: "OMAD", 6: "FAST", 0: "LOW" };
const typePattern   = { 1: "training", 2: "rest", 3: "training", 4: "rest", 5: "training", 6: "rest", 0: "rest" };

function shouldFireToday(check) {
  if (!check) return true;
  const dow = new Date().getDay();
  if (check === "weekday")  return dow >= 1 && dow <= 5;
  if (check === "training") return typePattern[dow] === "training";
  if (check === "eating")   return eatingPattern[dow] === "OMAD";
  if (check === "fast")     return eatingPattern[dow] === "FAST";
  if (check === "low")      return eatingPattern[dow] === "LOW";
  return true;
}

function prefField(cat) {
  if (cat === "workout") return "workout_enabled";
  if (cat === "meal")    return "meal_enabled";
  if (cat === "supp")    return "supp_enabled";
  return null;
}

async function sendReminder(r) {
  if (!shouldFireToday(r.dayCheck)) return;

  const subs = db.prepare("SELECT * FROM push_subscriptions").all();
  if (!subs.length) return;

  const byUser = new Map();
  subs.forEach((s) => {
    if (!byUser.has(s.user_id)) byUser.set(s.user_id, []);
    byUser.get(s.user_id).push(s);
  });

  const field = prefField(r.cat);
  const payload = JSON.stringify({
    title: r.title,
    body: r.body,
    tag: `reminder-${r.type}`,
    data: { type: "reminder", reminderType: r.type },
    url: "/today"
  });

  for (const [userId, userSubs] of byUser) {
    if (field) {
      const prefs = db.prepare(`SELECT ${field} FROM notification_prefs WHERE user_id = ?`).get(userId);
      if (prefs && prefs[field] === 0) continue;
    }
    await Promise.all(userSubs.map((s) => sendToSubscription(s, payload)));
  }

  console.log(`[push] reminder sent: ${r.type}`);
}

export function startReminderCrons() {
  for (const r of REMINDERS) {
    cron.schedule(r.cron, () => sendReminder(r).catch(console.error), { timezone: "Europe/Berlin" });
  }
  console.log(`[push] ${REMINDERS.length} reminder crons registered`);
}
