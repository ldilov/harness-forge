import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { parseAgentStartBrief } from "../../src/domain/runtime/agent-brief.js";

describe("agent start brief domain", () => {
  it("parses the contract fixture", () => {
    const fixture = JSON.parse(fs.readFileSync(path.join(process.cwd(), "tests", "fixtures", "contracts", "agent-brief.example.json"), "utf8"));

    const parsed = parseAgentStartBrief(fixture);

    expect(parsed.schemaVersion).toBe("1.0.0");
    expect(parsed.targets.map((target) => target.targetId)).toContain("codex");
  });

  it("rejects more than six recommended actions", () => {
    const fixture = JSON.parse(fs.readFileSync(path.join(process.cwd(), "tests", "fixtures", "contracts", "agent-brief.example.json"), "utf8"));
    fixture.recommendedNextActions = ["one", "two", "three", "four", "five", "six", "seven"];

    expect(() => parseAgentStartBrief(fixture)).toThrow();
  });
});
