/// <reference types="vitest" />

import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
  resolve: {
    extensions: [".js", ".json", ".vue", ".less", ".scss", ".ts"],
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    manifest: true,
  },
  test: {
    globals: true,
    environmentMatchGlobs: [["src/components/**", "jsdom"]],
    server: {
      deps: {
        inline: ["vuetify"],
      },
    },
    environment: "jsdom",
    coverage: {
      exclude: [],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 80,
      },
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
});
