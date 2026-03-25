import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("framework pack contract", () => {
  it("keeps framework docs, bundles, and catalog metadata aligned", async () => {
    const catalog = JSON.parse(
      await fs.readFile(path.join(root, "manifests", "catalog", "framework-assets.json"), "utf8")
    ) as {
      frameworks: Array<{
        id: string;
        bundleId: string;
        docPath: string;
        baseLanguage: string;
      }>;
    };
    const bundleManifest = JSON.parse(
      await fs.readFile(path.join(root, "manifests", "bundles", "frameworks.json"), "utf8")
    ) as {
      bundles: Array<{ id: string; paths: string[]; dependencies: string[] }>;
    };

    for (const framework of catalog.frameworks) {
      const bundle = bundleManifest.bundles.find((entry) => entry.id === framework.bundleId);
      expect(bundle, framework.id).toBeDefined();
      expect(bundle?.paths).toContain(framework.docPath);
      expect(bundle?.dependencies).toContain(`lang:${framework.baseLanguage}`);

      const docContent = await fs.readFile(path.join(root, framework.docPath), "utf8");
      expect(docContent).toContain("## Primary signals");
      expect(docContent).toContain("## Validation cues");
    }
  });
});
