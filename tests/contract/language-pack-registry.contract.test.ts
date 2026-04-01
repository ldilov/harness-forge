import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  validateFrameworkAssetShape,
  validateLanguageAssetShape
} from "../../scripts/ci/lib/context-surface-dedup.mjs";

const root = process.cwd();

describe("language pack registry contract", () => {
  it("gives every language pack explicit ownership and publication metadata", async () => {
    const manifest = JSON.parse(await fs.readFile(path.join(root, "manifests", "catalog", "language-assets.json"), "utf8"));

    const failures = Object.entries(manifest.languages ?? {}).flatMap(([languageId, entry]) =>
      validateLanguageAssetShape(languageId, entry)
    );

    expect(failures).toEqual([]);
  });

  it("gives every framework overlay an ownership note", async () => {
    const manifest = JSON.parse(await fs.readFile(path.join(root, "manifests", "catalog", "framework-assets.json"), "utf8"));
    const failures = (manifest.frameworks ?? []).flatMap((framework) => validateFrameworkAssetShape(framework));
    expect(failures).toEqual([]);
  });
});
