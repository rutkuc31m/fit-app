// Daily random-time notification (7:00–21:00 window).
// Web limitation: notifications fire only while the tab/PWA is alive.
// Strategy: pick a random minute in window per day, persist in localStorage,
// check every 30s; if current time passed and not yet fired → fire + mark fired.

import { quoteForDate } from "./quotes";
import { todayStr } from "./plan";

const KEY_TIME  = "fit.notify.time";   // "YYYY-MM-DD|HH:MM"
const KEY_FIRED = "fit.notify.fired";  // "YYYY-MM-DD"

const HOUR_START = 7;   // 07:00
const HOUR_END   = 21;  // 21:00 (exclusive-ish, last minute = 20:59)

const pickRandomTimeFor = (date) => {
  const totalMinutes = (HOUR_END - HOUR_START) * 60; // 14h = 840 min
  const offset = Math.floor(Math.random() * totalMinutes);
  const h = HOUR_START + Math.floor(offset / 60);
  const m = offset % 60;
  return `${date}|${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const getScheduledTimeToday = () => {
  const date = todayStr();
  const raw = localStorage.getItem(KEY_TIME);
  if (raw && raw.startsWith(date + "|")) return raw.split("|")[1];
  const fresh = pickRandomTimeFor(date);
  localStorage.setItem(KEY_TIME, fresh);
  return fresh.split("|")[1];
};

const nowHHMM = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const fireNotification = () => {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  const { q, a } = quoteForDate(todayStr());
  try {
    new Notification("Fit · Daily push", {
      body: `"${q}" — ${a}`,
      icon: "/icon-192.png",
      tag: "fit-daily",
      lang: "en"
    });
  } catch {
    // Some mobile browsers require ServiceWorkerRegistration.showNotification
    if (navigator.serviceWorker?.ready) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification("Fit · Daily push", {
          body: `"${q}" — ${a}`,
          icon: "/icon-192.png",
          tag: "fit-daily"
        });
      });
    }
  }
};

export const requestNotifyPermission = async () => {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return await Notification.requestPermission();
};

// Call once from app root. Returns cleanup fn.
export const startDailyNotify = () => {
  let intervalId = null;

  const tick = () => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const date = todayStr();
    const fired = localStorage.getItem(KEY_FIRED);
    if (fired === date) return;
    const scheduled = getScheduledTimeToday();
    if (nowHHMM() >= scheduled) {
      fireNotification();
      localStorage.setItem(KEY_FIRED, date);
    }
  };

  tick();
  intervalId = setInterval(tick, 30 * 1000); // 30s resolution

  return () => { if (intervalId) clearInterval(intervalId); };
};

// For debug / preview
export const getTodayScheduledTime = () => {
  try { return getScheduledTimeToday(); } catch { return null; }
};

export const fireTestNotification = () => fireNotification();
