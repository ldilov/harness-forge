import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("production package surface contract", () => {
  it("aligns package metadata, ignore rules, and required publish files", async () => {
    const [packageJson, npmIgnore, fixture] = await Promise.all([
      fs.readFile(path.join(root, "package.json"), "utf8").then(JSON.parse),
      fs.readFile(path.join(root, ".npmignore"), "utf8"),
      fs.readFile(path.join(root, "tests", "fixtures", "production-readiness", "publish-surface", "expected-files.json"), "utf8").then(JSON.parse)
    ]);

    expect(packageJson.name).toBe("@harness-forge/cli");
    expect(packageJson.bin?.hforge).toBe("./dist/cli/index.js");
    expect(packageJson.files).toEqual(expect.arrayContaining(["dist", "docs", "manifests", "targets", "scripts/ci"]));
    expect(npmIgnore).toContain("tests/");
    expect(npmIgnore).toContain("specs/");
    expect(npmIgnore).toContain(".hforge/");

    for (const relativePath of fixture.requiredFiles) {
      await expect(fs.access(path.join(root, relativePath))).resolves.toBeUndefined();
    }
  });
});
