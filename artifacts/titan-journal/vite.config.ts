import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const rawPort = process.env.PORT ?? "18405";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH ?? "/";
const appRoot = path.resolve(import.meta.dirname);

function spaFallbackPlugin() {
  return {
    name: "spa-fallback",
    closeBundle() {
      const outDir = path.resolve(appRoot, "dist/public");
      const indexPath = path.join(outDir, "index.html");
      const fallbackPath = path.join(outDir, "404.html");
      if (fs.existsSync(indexPath)) {
        fs.copyFileSync(indexPath, fallbackPath);
      }
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    spaFallbackPlugin(),
    ...(process.env.NODE_ENV !== "production" ? [runtimeErrorOverlay()] : []),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(appRoot, "src"),
      "@assets": path.resolve(appRoot, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: appRoot,
  build: {
    outDir: path.resolve(appRoot, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY_TARGET ?? "http://127.0.0.1:8080",
        changeOrigin: true,
      },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
