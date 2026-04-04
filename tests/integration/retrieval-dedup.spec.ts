import { describe, expect, it } from "vitest";
import { retrieveContext } from "../../src/application/runtime/retrieve-context.js";

describe("retrieval dedup integration", () => {
  it("suppresses duplicate non-canonical entries", () => {
    const result = retrieveContext("token", [
      { conceptId: "c1", path: "a", relevance: 0.9, tier: "hot", canonical: true, projection: false },
      { conceptId: "c1", path: "b", relevance: 0.8, tier: "warm", canonical: false, projection: false }
    ]);
    expect(result.suppressed).toHaveLength(1);
  });
});
