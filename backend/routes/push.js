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

export default r;
