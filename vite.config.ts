import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "./",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Redirect Tauri API imports to our Electron adapter modules
      "@tauri-apps/api/core": path.resolve(
        __dirname,
        "./src/lib/electron-adapter/core.ts",
      ),
      "@tauri-apps/api/event": path.resolve(
        __dirname,
        "./src/lib/electron-adapter/event.ts",
      ),
      "@tauri-apps/api/window": path.resolve(
        __dirname,
        "./src/lib/electron-adapter/window.ts",
      ),
      "@tauri-apps/plugin-dialog": path.resolve(
        __dirname,
        "./src/lib/electron-adapter/plugin-dialog.ts",
      ),
      "@tauri-apps/plugin-os": path.resolve(
        __dirname,
        "./src/lib/electron-adapter/plugin-os.ts",
      ),
      "@tauri-apps/plugin-opener": path.resolve(
        __dirname,
        "./src/lib/electron-adapter/plugin-opener.ts",
      ),
    },
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
});
