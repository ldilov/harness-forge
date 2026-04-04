import { describe, expect, it } from "vitest";
import { buildAuthorityMap } from "../../src/application/runtime/build-authority-map.js";

describe("authority map contract", () => {
  it("builds canonical authority records", () => {
    const map = buildAuthorityMap([{ conceptId: "c1", canonicalPath: "AGENTS.md", tier: "hot", aliases: [], projections: [] }]);
    expect(map.concepts).toHaveLength(1);
    expect(map.concepts[0].canonicalPath).toBe("AGENTS.md");
  });
});
