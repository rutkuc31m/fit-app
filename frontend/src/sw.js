// Custom service worker for fit-app
// - Precaches build assets via Workbox
// - Handles Web Push notifications + click-through

import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { NetworkFirst } from "workbox-strategies";

self.skipWaiting();
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

// API (NetworkFirst with short timeout)
registerRoute(
  ({ url }) => url.hostname === "api.fit.rutkuc.com",
  new NetworkFirst({ cacheName: "api", networkTimeoutSeconds: 4 })
);

// ─── PUSH ───
self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data?.text?.() || "" }; }
  const title = data.title || "Fit";
  const options = {
    body: data.body || "",
    icon: data.icon || "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || "fit-push",
    data: { url: data.url || "/today" },
    vibrate: [80, 40, 80]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
