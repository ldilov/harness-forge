import { describe, expect, it } from "vitest";

import {
  classifySeededRelativePath,
  getCanonicalRulePathForSeededRelativePath,
  getSeededArchivePath,
  isDerivedSeededRuleKind,
  isSeededLanguageId
} from "../../src/shared/seeded-knowledge.js";

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

  it("marks seeded rule kinds as derived surfaces", () => {
    expect(isDerivedSeededRuleKind("common-rule")).toBe(true);
    expect(isDerivedSeededRuleKind("language-rule")).toBe(true);
    expect(isDerivedSeededRuleKind("overview")).toBe(false);
  });

  it("maps seeded rule paths back to canonical rule paths", () => {
    expect(getCanonicalRulePathForSeededRelativePath("rules/common/testing.md")).toBe("rules/common/testing.md");
    expect(getCanonicalRulePathForSeededRelativePath("rules/java/testing.md")).toBe("rules/java/testing.md");
    expect(getCanonicalRulePathForSeededRelativePath("docs/overview.md")).toBeNull();
  });
});
