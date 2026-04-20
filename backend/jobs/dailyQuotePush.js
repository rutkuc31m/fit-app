import cron from "node-cron";
import db from "../db.js";
import { sendToSubscription } from "../push_worker.js";
import { quoteForDate } from "../quotes.js";

export function startDailyQuoteCron() {
  // Every day at 07:00 Berlin time
  cron.schedule("0 7 * * *", async () => {
    const today = new Date().toISOString().split("T")[0];
    const quote = quoteForDate(today);

    const subs = db.prepare("SELECT * FROM push_subscriptions").all();
    if (!subs.length) return;

    // Group by user so each user gets one push (across multiple devices)
    const byUser = new Map();
    subs.forEach((s) => {
      if (!byUser.has(s.user_id)) byUser.set(s.user_id, []);
      byUser.get(s.user_id).push(s);
    });

    for (const [userId, userSubs] of byUser) {
      // Check if user has quote push enabled (default: enabled)
      const prefs = db.prepare("SELECT quote_enabled FROM notification_prefs WHERE user_id = ?").get(userId);
      if (prefs && prefs.quote_enabled === 0) continue;

      const payload = JSON.stringify({
        title: `„${quote.q}"`,
        body: quote.a ? `— ${quote.a}` : "",
        tag: `quote-${today}`,
        data: { type: "daily_quote", date: today },
        url: "/today"
      });

      await Promise.all(userSubs.map((s) => sendToSubscription(s, payload)));
    }

    console.log(`[push] daily quote sent for ${today}`);
  }, { timezone: "Europe/Berlin" });

  console.log("[push] daily quote cron registered (07:00 Berlin)");
}
