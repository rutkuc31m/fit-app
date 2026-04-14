import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "FitApp",
        short_name: "FitApp",
        description: "Transformation tracker",
        theme_color: "#0c0e0d",
        background_color: "#0c0e0d",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" },
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
        ]
      },
      workbox: {
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.fit\.rutkuc\.com\/.*/,
            handler: "NetworkFirst",
            options: { cacheName: "api", networkTimeoutSeconds: 4 }
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:8001", changeOrigin: true }
    }
  }
});
