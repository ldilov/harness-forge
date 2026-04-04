import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { parseTargetComparisonReport } from "../../src/domain/targets/target-comparison.js";

describe("target comparison report contract", () => {
  it("parses example fixture", () => {
    const fixturePath = path.join(
      process.cwd(),
      ".specify/features/20260404-0200-usefulness-first-cli-experience/contracts/target-compare.example.json"
    );
    const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf-8"));
    const result = parseTargetComparisonReport(fixture);
    expect(result.leftTargetId).toBe("codex");
    expect(result.rightTargetId).toBe("claude-code");
    expect(result.headlineVerdict.length).toBeGreaterThan(0);
    expect(result.capabilityComparisons.length).toBeGreaterThan(0);
  });
});
