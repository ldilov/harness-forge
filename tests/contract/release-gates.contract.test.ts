import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("release gates contract", () => {
  it("ships the expected CI validators", async () => {
    const files = [
      "scripts/ci/validate-content-metadata.mjs",
      "scripts/ci/validate-seeded-knowledge-coverage.mjs",
      "scripts/ci/validate-generated-sync.mjs",
      "scripts/ci/validate-pack-dependencies.mjs",
      "scripts/ci/validate-packed-install-surface.mjs",
      "scripts/ci/release-smoke.mjs"
    ];

    await Promise.all(files.map(async (relativePath) => expect(await fs.readFile(path.join(root, relativePath), "utf8")).toBeTruthy()));
  });

  it("wires release validation scripts into package.json", async () => {
    const packageJson = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"));

    expect(packageJson.scripts["validate:content-metadata"]).toContain("validate-content-metadata.mjs");
    expect(packageJson.scripts["validate:seeded-coverage"]).toContain("validate-seeded-knowledge-coverage.mjs");
    expect(packageJson.scripts["validate:generated-sync"]).toContain("validate-generated-sync.mjs");
    expect(packageJson.scripts["validate:package-surface"]).toContain("validate-packed-install-surface.mjs");
    expect(packageJson.scripts["validate:release"]).toContain("release-smoke.mjs");
  });
});
