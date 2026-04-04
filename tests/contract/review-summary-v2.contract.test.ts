import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { parseReviewSummaryV2 } from "../../src/domain/review/review-summary-v2.js";

describe("review summary v2 contract", () => {
  it("parses example fixture", () => {
    const fixturePath = path.join(
      process.cwd(),
      "tests/fixtures/contracts/review-summary-v2.example.json"
    );
    const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf-8"));
    const result = parseReviewSummaryV2(fixture);
    expect(result.workspaceRoot).toBeTruthy();
    expect(result.recommendedInstall.targets.length).toBeGreaterThan(0);
    expect(result.topChanges.length).toBeGreaterThan(0);
  });
});
