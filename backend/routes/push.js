import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../auth.js";
import { sendToSubscription, VAPID_PUBLIC } from "../push_worker.js";

const r = Router();

// Public: expose VAPID public key so frontend can subscribe
r.get("/public-key", (_req, res) => res.json({ key: VAPID_PUBLIC }));

r.use(requireAuth);

// POST /api/push/subscribe — store subscription for this user
r.post("/subscribe", (req, res) => {
  const { endpoint, keys } = req.body || {};
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ error: "invalid_subscription" });
  }
  const ua = req.get("user-agent") || null;
  try {
    db.prepare(`
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, ua)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(endpoint) DO UPDATE SET user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth, ua = excluded.ua
    `).run(req.user.id, endpoint, keys.p256dh, keys.auth, ua);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

r.delete("/subscribe", (req, res) => {
  const { endpoint } = req.body || {};
  if (!endpoint) return res.status(400).json({ error: "endpoint_required" });
  db.prepare("DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?").run(req.user.id, endpoint);
  res.json({ ok: true });
});

// POST /api/push/test — send a test push to all this user's subscriptions
r.post("/test", async (req, res) => {
  const subs = db.prepare("SELECT * FROM push_subscriptions WHERE user_id = ?").all(req.user.id);
  const payload = JSON.stringify({
    title: "Fit · Test push",
    body: "Push pipeline working. Stay hard.",
    url: "/today"
  });
  const results = await Promise.all(subs.map((s) => sendToSubscription(s, payload)));
  const failed = results.filter((x) => !x.ok).length;
  res.json({ sent: subs.length - failed, failed });
});

// GET /api/push/prefs — get notification preferences for current user
r.get("/prefs", (req, res) => {
  let prefs = db.prepare("SELECT * FROM notification_prefs WHERE user_id = ?").get(req.user.id);
  if (!prefs) {
    prefs = { user_id: req.user.id, quote_enabled: 1, workout_enabled: 1, meal_enabled: 1, supp_enabled: 1 };
  }
  res.json(prefs);
});

// PUT /api/push/prefs — update notification preferences
r.put("/prefs", (req, res) => {
  const { quote_enabled, workout_enabled, meal_enabled, supp_enabled } = req.body || {};
  db.prepare(`
    INSERT INTO notification_prefs (user_id, quote_enabled, workout_enabled, meal_enabled, supp_enabled)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      quote_enabled   = excluded.quote_enabled,
      workout_enabled = excluded.workout_enabled,
      meal_enabled    = excluded.meal_enabled,
      supp_enabled    = excluded.supp_enabled
  `).run(
    req.user.id,
    quote_enabled   == null ? 1 : +!!quote_enabled,
    workout_enabled == null ? 1 : +!!workout_enabled,
    meal_enabled    == null ? 1 : +!!meal_enabled,
    supp_enabled    == null ? 1 : +!!supp_enabled
  );
  res.json({ ok: true });
});

export default r;
