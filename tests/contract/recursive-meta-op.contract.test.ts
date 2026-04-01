import { describe, expect, it } from "vitest";

import { parseRecursiveMetaOpProposal } from "../../src/domain/recursive/meta-op-proposal.js";

describe("recursive meta-op contract", () => {
  it("parses proposal-first meta-op artifacts", () => {
    const proposal = parseRecursiveMetaOpProposal({
      metaOpId: "META-001",
      sessionId: "RS-001",
      targetKind: "instruction",
      targetRef: ".hforge/library/skills/token-budget-optimizer/SKILL.md",
      rationale: "Tighten compaction guidance",
      patchSummary: "Clarify root-frame usage",
      status: "proposed",
      createdAt: "2026-04-01T10:00:00.000Z"
    });

    expect(proposal.targetKind).toBe("instruction");
  });

});
