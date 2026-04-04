import { describe, expect, it } from "vitest";
import { buildSurfaceTierIndex } from "../../src/application/runtime/build-surface-tiers.js";

describe("surface tier contract", () => {
  it("builds deterministic tier index", () => {
    const index = buildSurfaceTierIndex([
      { surfacePath: "B", tier: "warm", defaultInclusion: false, dropOrderRank: 1 },
      { surfacePath: "A", tier: "hot", defaultInclusion: true, dropOrderRank: 0 }
    ]);
    expect(index.entries[0].surfacePath).toBe("A");
  });
});
