import { describe, expect, it } from "vitest";

import type { AgentStartBrief } from "../../src/domain/runtime/agent-brief.js";
import { renderAgentBriefMarkdown } from "../../src/application/runtime/render-agent-brief.js";

function createBrief(): AgentStartBrief {
  return {
    schemaVersion: "1.0.0",
    workspace: { root: "/tmp/example", label: "example" },
    generatedAt: "2026-04-24T00:00:00.000Z",
    sourceRefs: [".hforge/runtime/index.json"],
    detectedStack: ["Node.js", "TypeScript"],
    targets: [
      {
        targetId: "codex",
        displayName: "Codex",
        supportMode: "first-class",
        bridgeSurfaces: ["AGENTS.md"],
        caveats: [],
        recommendedBehavior: "Use the agent brief."
      }
    ],
    authoritativeSurfaces: ["AGENTS.md", ".hforge/runtime/agent-brief.md"],
    commandResolution: ["hforge", "npx @harness-forge/cli"],
    recommendedNextActions: ["Read the brief.", "Inspect the command catalog."],
    freshness: { status: "current", reason: "Fresh.", recommendedAction: "Use it." },
    fallbackGuidance: ["Refresh if missing."],
    orientation: {
      firstRun: "Harness Forge is active.",
      sessionStart: "Use the brief.",
      deeperWork: "Use deeper commands."
    }
  };
}

describe("renderAgentBriefMarkdown", () => {
  it("renders deterministic compact markdown", () => {
    const brief = createBrief();

    const first = renderAgentBriefMarkdown(brief);
    const second = renderAgentBriefMarkdown(brief);

    expect(first).toBe(second);
    expect(first).toContain("# Harness Forge Agent Brief");
    expect(first.trim().split(/\s+/u).length).toBeLessThanOrEqual(600);
  });

  it("limits recommended next actions to six rendered items", () => {
    const brief = createBrief();
    brief.recommendedNextActions = ["one", "two", "three", "four", "five", "six"];

    const rendered = renderAgentBriefMarkdown(brief);

    expect(rendered.match(/^- /gmu)?.length ?? 0).toBeGreaterThanOrEqual(6);
    expect(rendered).toContain("- six");
  });
});
