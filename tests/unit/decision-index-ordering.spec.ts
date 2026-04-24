import { describe, expect, it } from "vitest";

import { sortDecisionIndexEntries } from "../../src/application/runtime/decision-runtime-store.js";
import type { DecisionIndexEntry } from "../../src/domain/runtime/decision-record.js";

function entry(id: string, createdAt: string): DecisionIndexEntry {
  return {
    id,
    recordType: "asr",
    path: `.hforge/runtime/decisions/${id}.json`,
    title: id,
    status: "proposed",
    architectureSignificance: "medium",
    taskRefs: [],
    supersedes: [],
    supersededBy: [],
    reviewStatus: "inferred",
    createdAt,
    updatedAt: createdAt
  };
}

describe("decision index ordering", () => {
  it("sorts newest first and falls back to id for timestamp ties", () => {
    const sorted = sortDecisionIndexEntries([
      entry("dec-b", "2026-04-01T10:00:00.000Z"),
      entry("dec-c", "2026-04-02T10:00:00.000Z"),
      entry("dec-a", "2026-04-01T10:00:00.000Z")
    ]);

    expect(sorted.map((item) => item.id)).toEqual(["dec-c", "dec-a", "dec-b"]);
  });
});
