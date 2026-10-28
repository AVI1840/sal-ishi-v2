import { defineConfig } from "vitest/config";
import path from "path";

// Separate from vite.config.ts on purpose: keeps the app's Vite build
// config (rollup chunking etc.) untouched while giving the domain layer
// (src/domain/) a real, fast unit-test runner. See
// src/domain/__tests__/matchingEngine.golden.test.ts.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
