import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("local validation contract", () => {
  it("distinguishes local and release-grade validation for maintainers", async () => {
    const [packageJson, validationDoc, qualityGates, contributing] = await Promise.all([
      fs.readFile(path.join(root, "package.json"), "utf8").then(JSON.parse),
      fs.readFile(path.join(root, "VALIDATION.md"), "utf8"),
      fs.readFile(path.join(root, "docs", "quality-gates.md"), "utf8"),
      fs.readFile(path.join(root, "CONTRIBUTING.md"), "utf8")
    ]);

    expect(packageJson.scripts["validate:local"]).toBeTruthy();
    expect(validationDoc).toContain("validate:local");
    expect(validationDoc).toContain("validate:release");
    expect(qualityGates).toContain("Daily maintainer gate");
    expect(contributing).toContain("validate:local");
  });
});
