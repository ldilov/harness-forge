import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { parseAgentStartBrief } from "../../src/domain/runtime/agent-brief.js";

function wordCount(value: string): number {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

describe("agent brief contract", () => {
  it("requires the shared brief fields agents need for startup orientation", () => {
    const fixture = JSON.parse(fs.readFileSync(path.join(process.cwd(), "tests", "fixtures", "contracts", "agent-brief.example.json"), "utf8"));

    const brief = parseAgentStartBrief(fixture);

    expect(brief.authoritativeSurfaces).toContain(".hforge/runtime/agent-brief.md");
    expect(brief.commandResolution.length).toBeGreaterThan(0);
    expect(brief.recommendedNextActions.length).toBeLessThanOrEqual(6);
    expect(brief.targets.some((target) => target.supportMode === "partial")).toBe(true);
  });

  it("keeps rendered orientation text within the compactness budget", () => {
    const fixture = JSON.parse(fs.readFileSync(path.join(process.cwd(), "tests", "fixtures", "contracts", "agent-brief.example.json"), "utf8"));
    const brief = parseAgentStartBrief(fixture);
    const rendered = [
      brief.orientation.firstRun,
      brief.orientation.sessionStart,
      brief.orientation.deeperWork,
      ...brief.recommendedNextActions
    ].join("\n");

    expect(wordCount(rendered)).toBeLessThanOrEqual(600);
  });
});
