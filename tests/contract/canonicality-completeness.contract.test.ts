import { describe, expect, it } from "vitest";
import { parseAuthorityMapDocument } from "../../src/domain/runtime/authority-and-dedup.js";

describe("canonicality completeness", () => {
  it("requires canonical path per concept record", () => {
    const parsed = parseAuthorityMapDocument({
      schemaVersion: "1",
      generatedAt: new Date().toISOString(),
      concepts: [{ conceptId: "runtime.orientation", canonicalPath: "AGENTS.md", tier: "hot", aliases: [], projections: [] }]
    });
    expect(parsed.concepts[0].canonicalPath).toBe("AGENTS.md");
  });
});
