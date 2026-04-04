import { describe, expect, it } from "vitest";
import { rankRetrievalResults } from "../../src/application/runtime/rank-retrieval-results.js";

describe("retrieval cold suppression integration", () => {
  it("demotes cold surfaces", () => {
    const ranked = rankRetrievalResults([
      { conceptId: "c", path: "hot", relevance: 0.4, tier: "hot", canonical: false, projection: false },
      { conceptId: "c", path: "cold", relevance: 0.4, tier: "cold", canonical: false, projection: false }
    ]);
    expect(ranked[0].path).toBe("hot");
  });
});
