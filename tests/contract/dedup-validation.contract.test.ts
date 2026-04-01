import { describe, expect, it } from "vitest";

import {
  parseFrontMatter,
  validateLanguageAssetShape,
  validateSeededDerivationPolicy,
  validateWrapperThinness
} from "../../scripts/ci/lib/context-surface-dedup.mjs";

describe("deduplication validation contract", () => {
  it("flags a wrapper that omits thin-surface metadata", () => {
    const content = `# Wrapper\n\nThis is a large body with no canonical execution surface.`;
    const failures = validateWrapperThinness(content, "fixture-wrapper.md");
    expect(failures.length).toBeGreaterThan(0);
  });

  it("flags a registry entry without authorship metadata", () => {
    const failures = validateLanguageAssetShape("go", { displayName: "Go" });
    expect(failures.length).toBeGreaterThan(0);
  });

  it("flags a seeded manifest without derivation policy", () => {
    const failures = validateSeededDerivationPolicy({ files: [] });
    expect(failures.length).toBeGreaterThan(0);
  });

  it("parses canonical_source metadata from generated wrappers", () => {
    const parsed = parseFrontMatter(`---\ngenerated: true\ncanonical_source: skills/go-engineering/SKILL.md\n---\nbody`);
    expect(parsed?.metadata.canonical_source).toBe("skills/go-engineering/SKILL.md");
  });
});
