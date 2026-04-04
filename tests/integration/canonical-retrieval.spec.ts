import { describe, expect, it } from "vitest";
import { retrieveContext } from "../../src/application/runtime/retrieve-context.js";

describe("canonical retrieval integration", () => {
  it("prefers canonical concept entries", () => {
    const result = retrieveContext("orientation", [
      { conceptId: "runtime.orientation", path: "AGENTS.md", relevance: 0.7, tier: "hot", canonical: true, projection: false },
      { conceptId: "runtime.orientation", path: "CLAUDE.md", relevance: 0.75, tier: "hot", canonical: false, projection: false }
    ]);
    expect(result.selected[0].path).toBe("AGENTS.md");
  });
});
