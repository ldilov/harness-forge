import path from "node:path";

import { describe, expect, it } from "vitest";

import { recommendFromIntelligence } from "../../src/application/recommendations/recommend-from-intelligence.js";

const root = process.cwd();

describe("recommendation evidence integration", () => {
  it("explains framework-aware recommendations for a TypeScript web app", async () => {
    const fixtureRoot = path.join(root, "tests", "fixtures", "benchmarks", "typescript-web-app");
    const result = await recommendFromIntelligence(fixtureRoot);
    const bundleIds = new Set(result.recommendations.bundles.map((item) => item.id));
    const reactBundle = result.recommendations.bundles.find((item) => item.id === "framework:react");
    const viteBundle = result.recommendations.bundles.find((item) => item.id === "framework:vite");

    expect(bundleIds.has("lang:typescript")).toBe(true);
    expect(bundleIds.has("framework:react")).toBe(true);
    expect(bundleIds.has("framework:vite")).toBe(true);
    expect(reactBundle?.evidence.join(" ")).toContain("react");
    expect(viteBundle?.evidence.join(" ")).toContain("vite");
    expect(result.recommendations.profiles.some((item) => item.id === "developer")).toBe(true);
  });

  it("routes security-sensitive repositories toward the security scan skill", async () => {
    const fixtureRoot = path.join(root, "tests", "fixtures", "benchmarks", "security-service");
    const result = await recommendFromIntelligence(fixtureRoot);

    expect(result.recommendations.skills.some((item) => item.id === "skill:security-scan")).toBe(true);
    expect(result.frameworkMatches.some((item) => item.id === "express")).toBe(true);
    expect(result.riskSignals.some((item) => item.id === "security")).toBe(true);
  });
});
