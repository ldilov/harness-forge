import { describe, expect, it } from "vitest";

import { buildDecisionChains } from "../../src/application/runtime/build-decision-chain.js";
import type { AdrRecord } from "../../src/domain/runtime/decision-record.js";

function adr(id: string, supersedes: string[] = [], supersededBy: string[] = []): AdrRecord {
  return {
    id,
    recordType: "adr",
    title: id,
    status: supersededBy.length > 0 ? "superseded" : "accepted",
    reviewStatus: supersededBy.length > 0 ? "superseded" : "approved",
    architectureSignificance: "high",
    taskRefs: [],
    requirementRefs: [],
    provenance: [],
    tags: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    asrRef: "ASR-1",
    decisionSummary: id,
    context: id,
    optionsConsidered: [],
    decision: id,
    consequences: [],
    validationPlan: [],
    rolloutPlan: [],
    risksAndMitigations: [],
    followUps: [],
    supersedes,
    supersededBy
  };
}

describe("decision chains", () => {
  it("identifies the current decision in a complete chain", () => {
    const chains = buildDecisionChains([adr("ADR-1", [], ["ADR-2"]), adr("ADR-2", ["ADR-1"])]);
    expect(chains[0]?.decisionIds).toEqual(["ADR-1", "ADR-2"]);
    expect(chains[0]?.currentDecisionId).toBe("ADR-2");
  });

  it("reports missing lineage references as findings", () => {
    const chains = buildDecisionChains([adr("ADR-2", ["ADR-1"])]);
    expect(chains.flatMap((chain) => chain.findings).some((finding) => finding.category === "broken-lineage")).toBe(true);
  });
});
