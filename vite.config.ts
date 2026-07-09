import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

export default defineConfig(({ mode, command }) => {
  const useBridge = command === "serve" || mode === "web";
  
  return {
    plugins: [vue(), tailwindcss()],
    base: "./",
    resolve: {
      alias: useBridge ? {
        "real-onin-sdk": resolve(__dirname, "node_modules/onin-sdk"),
        "onin-sdk": resolve(__dirname, "src/compat/onin-sdk-mock.ts"),
      } : {},
    },
    server: {
      port: 5173,
      cors: true,
    },
    test: {
      globals: true,
      environment: "node",
    },
  };
});
