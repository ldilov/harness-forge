import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@app": resolve(__dirname, "src/application"),
      "@cli": resolve(__dirname, "src/cli"),
      "@domain": resolve(__dirname, "src/domain"),
      "@infra": resolve(__dirname, "src/infrastructure"),
      "@shared": resolve(__dirname, "src/shared"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.spec.ts", "tests/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    maxWorkers: 8,
    minWorkers: 1,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      thresholds: {
        lines: 40,
        functions: 60,
        branches: 40,
        statements: 40
      }
    }
  }
});
