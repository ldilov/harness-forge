import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("release workflow contract", () => {
  it("ships CI, release, and security workflows with release-grade validation", async () => {
    const [ci, release, security] = await Promise.all([
      fs.readFile(path.join(root, ".github", "workflows", "ci.yml"), "utf8"),
      fs.readFile(path.join(root, ".github", "workflows", "release-package.yml"), "utf8"),
      fs.readFile(path.join(root, ".github", "workflows", "security.yml"), "utf8")
    ]);

    expect(ci).toContain("validate:local");
    expect(ci).toContain("smoke:cli");
    expect(ci).toContain("windows-latest");
    expect(ci).toContain("macos-latest");
    expect(release).toContain("release:dry-run");
    expect(release).toContain("npm publish --access public --provenance");
    expect(security).toContain("npm audit --omit=dev");
    expect(security).toContain("validate:package-surface");
  });
});
