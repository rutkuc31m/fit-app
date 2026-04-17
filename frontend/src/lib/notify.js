// Web Push subscription helper.
// Backend handles scheduling (random time 07:00–21:00 each day) + sending via VAPID.
// This module talks to the SW PushManager and backend /api/push/subscribe.

import { api } from "./api";

const urlBase64ToUint8Array = (b64) => {
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
};

export const pushSupported = () =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

export const getPushStatus = async () => {
  if (!pushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) return "subscribed";
  if (Notification.permission === "granted") return "granted";
  return "default";
};

export const subscribeToPush = async () => {
  if (!pushSupported()) throw new Error("unsupported");

  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error(perm);

  const { key } = await api.get("/push/public-key");
  const reg = await navigator.serviceWorker.ready;

  // Drop any stale sub first
  const existing = await reg.pushManager.getSubscription();
  if (existing) await existing.unsubscribe().catch(() => {});

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(key)
  });

  const json = sub.toJSON();
  await api.post("/push/subscribe", {
    endpoint: json.endpoint,
    keys: json.keys
  });
  return "subscribed";
};

export const unsubscribeFromPush = async () => {
  if (!pushSupported()) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  await api.del("/push/subscribe", { endpoint: sub.endpoint }).catch(() => {});
  await sub.unsubscribe().catch(() => {});
};

export const sendTestPush = () => api.post("/push/test", {});
