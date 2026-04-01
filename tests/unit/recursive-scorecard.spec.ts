import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { parseRecursiveTrajectoryScorecard } from "../../src/domain/recursive/scorecard.js";

describe("recursive scorecard unit", () => {
  it("keeps normalized score ranges intact", async () => {
    const fixture = JSON.parse(
      await fs.readFile(path.join(process.cwd(), "tests", "fixtures", "recursive-rlm", "scorecards", "good.json"), "utf8")
    );
    const scorecard = parseRecursiveTrajectoryScorecard(fixture);

    expect(scorecard.safetyScore).toBeLessThanOrEqual(1);
  });

});
