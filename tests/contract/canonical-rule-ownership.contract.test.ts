import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  validateCanonicalRuleAuthorship,
  validateSeededDerivationPolicy
} from "../../scripts/ci/lib/context-surface-dedup.mjs";

const root = process.cwd();

describe("canonical rule ownership contract", () => {
  it("declares derivation policy for seeded rule surfaces and keeps them aligned to canonical rules", async () => {
    const manifest = JSON.parse(
      await fs.readFile(path.join(root, "manifests", "catalog", "seeded-knowledge-files.json"), "utf8")
    );

    expect(validateSeededDerivationPolicy(manifest)).toEqual([]);
    await expect(validateCanonicalRuleAuthorship(root, manifest)).resolves.toEqual([]);
  });
});
