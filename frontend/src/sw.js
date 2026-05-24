// Custom service worker for fit-app
// - Precaches build assets via Workbox
// - Keeps API data fresh

import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { NetworkOnly } from "workbox-strategies";

self.skipWaiting();
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

// API data should be fresh. Static app assets are precached; logs are not.
registerRoute(
  ({ url }) => url.hostname === "api.fit.rutkuc.com",
  new NetworkOnly()
);
