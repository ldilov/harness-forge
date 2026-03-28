import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("production README and docs contract", () => {
  it("keeps the product front door and maintainer docs aligned", async () => {
    const [readme, releaseProcess, contributing, changelog] = await Promise.all([
      fs.readFile(path.join(root, "README.md"), "utf8"),
      fs.readFile(path.join(root, "docs", "release-process.md"), "utf8"),
      fs.readFile(path.join(root, "CONTRIBUTING.md"), "utf8"),
      fs.readFile(path.join(root, "CHANGELOG.md"), "utf8")
    ]);

    expect(readme).toContain("validate:local");
    expect(readme).toContain("release:dry-run");
    expect(readme).toContain("refresh --root");
    expect(readme).toContain("review --root");
    expect(releaseProcess).toContain("validate:release");
    expect(contributing).toContain("validate:local");
    expect(changelog).toContain("Unreleased");
  });
});
