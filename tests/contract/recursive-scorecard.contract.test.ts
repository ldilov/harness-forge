import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { parseRecursiveTrajectoryScorecard } from "../../src/domain/recursive/scorecard.js";

const root = process.cwd();

describe("recursive scorecard contract", () => {
  it("parses scorecards that expose waste signals and recommendations", async () => {
    const fixture = JSON.parse(
      await fs.readFile(path.join(root, "tests", "fixtures", "recursive-rlm", "scorecards", "good.json"), "utf8")
    );
    const scorecard = parseRecursiveTrajectoryScorecard(fixture);

    expect(scorecard.effectivenessScore).toBeGreaterThan(0.9);
  });

});
