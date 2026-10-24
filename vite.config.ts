import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages serves a project site from /<repo>/. The workflow sets DEPLOY_TARGET.
const base = process.env.DEPLOY_TARGET === "gh-pages" ? "/bench-mirror/" : "/";

export default defineConfig({
  base,
  define: { __BUILD__: JSON.stringify(new Date().toISOString().slice(5, 16).replace("T", " ")) },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/apple-touch-icon.png"],
      manifest: {
        name: "Bench Mirror",
        short_name: "Bench",
        description: "Read-only phone view of Bench: Today, Deck, this week, TWM and threads.",
        theme_color: "#26364f",
        background_color: "#f4f3ef",
        display: "standalone",
        orientation: "portrait",
        start_url: base,
        scope: base,
        icons: [
          { src: `${base}icons/icon-192.png`, sizes: "192x192", type: "image/png", purpose: "any" },
          { src: `${base}icons/icon-512.png`, sizes: "512x512", type: "image/png", purpose: "any" },
        ],
      },
      // The snapshot is fetched from Dropbox at runtime; only the app shell is precached.
      workbox: { globPatterns: ["**/*.{js,css,html,png,svg}"] },
    }),
  ],
});
