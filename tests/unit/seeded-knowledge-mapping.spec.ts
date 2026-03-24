import { describe, expect, it } from "vitest";

import { classifySeededRelativePath, getSeededArchivePath, isSeededLanguageId } from "../../src/shared/seeded-knowledge.js";

describe("seeded knowledge mapping helpers", () => {
  it("recognizes supported seeded languages", () => {
    expect(isSeededLanguageId("typescript")).toBe(true);
    expect(isSeededLanguageId("python")).toBe(false);
  });

  it("maps seeded archive paths correctly", () => {
    expect(getSeededArchivePath("java", "docs/overview.md")).toBe("language-knowledge-bases/java-knowledge-base/docs/overview.md");
  });

  it("classifies seeded content kinds", () => {
    expect(classifySeededRelativePath("docs/overview.md")).toBe("overview");
    expect(classifySeededRelativePath("examples/01-node-api.md")).toBe("example");
    expect(classifySeededRelativePath("rules/common/testing.md")).toBe("common-rule");
    expect(classifySeededRelativePath("legacy-seed/typescript/testing.md")).toBe("legacy-seed");
  });
});
