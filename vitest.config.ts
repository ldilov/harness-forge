import { defineConfig } from "vitest/config";

export default defineConfig({
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
