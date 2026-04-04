import { describe, expect, it } from "vitest";
import { detectDuplicateInventory } from "../../src/application/runtime/detect-duplicates.js";

describe("duplicate inventory contract", () => {
  it("produces exact duplicate groups", () => {
    const doc = detectDuplicateInventory([
      {
        conceptId: "skill.a",
        canonicalPath: "a.md",
        duplicatePath: "b.md",
        canonicalContent: "same text",
        duplicateContent: "same text"
      }
    ]);
    expect(doc.duplicateGroups.length).toBe(1);
    expect(doc.duplicateGroups[0].duplicateType).toBe("exact");
  });
});
