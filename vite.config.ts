import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  base: "./",
  server: {
    port: 5173,
    cors: true,
  },
  test: {
    globals: true,
    environment: "node",
  },
});
