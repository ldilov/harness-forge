import { describe, expect, it } from "vitest";
import { buildSurfaceTierIndex } from "../../src/application/runtime/build-surface-tiers.js";

describe("surface tier hydration integration", () => {
  it("keeps hot entries in index", () => {
    const index = buildSurfaceTierIndex([{ surfacePath: "AGENTS.md", tier: "hot", defaultInclusion: true, dropOrderRank: 0 }]);
    expect(index.entries[0].tier).toBe("hot");
  });
});
