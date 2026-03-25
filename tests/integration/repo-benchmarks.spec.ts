import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { recommendFromIntelligence } from "../../src/application/recommendations/recommend-from-intelligence.js";

const root = process.cwd();

describe("benchmark repo detection", async () => {
  const inventoryPath = path.join(root, "tests", "fixtures", "benchmarks", "index.json");
  const inventory = JSON.parse(await fs.readFile(inventoryPath, "utf8")) as {
    scenarios: Array<{
      id: string;
      fixturePath: string;
      expectedSignals: string[];
      expectedRecommendations: string[];
    }>;
  };

  for (const scenario of inventory.scenarios) {
    it(`matches benchmark expectations for ${scenario.id}`, async () => {
      const result = await recommendFromIntelligence(path.join(root, scenario.fixturePath));
      const signalIds = new Set([
        ...result.dominantLanguages.map((item) => `lang:${item.id}`),
        ...result.frameworkMatches.map((item) => `framework:${item.id}`),
        ...result.riskSignals.map((item) => `risk:${item.id}`)
      ]);
      const recommendationIds = new Set([
        ...result.recommendations.bundles.map((item) => item.id),
        ...result.recommendations.profiles.map((item) => item.id),
        ...result.recommendations.skills.map((item) => item.id),
        ...result.recommendations.validations.map((item) => item.id)
      ]);

      for (const expectedSignal of scenario.expectedSignals) {
        expect(signalIds.has(expectedSignal)).toBe(true);
      }

      for (const expectedRecommendation of scenario.expectedRecommendations) {
        expect(recommendationIds.has(expectedRecommendation)).toBe(true);
      }
    });
  }
});
