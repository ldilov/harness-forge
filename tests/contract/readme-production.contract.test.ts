import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("production README and docs contract", () => {
  it("keeps maintainer docs aligned", async () => {
    const [releaseProcess, contributing, changelog] = await Promise.all([
      fs.readFile(path.join(root, "docs", "release-process.md"), "utf8"),
      fs.readFile(path.join(root, "CONTRIBUTING.md"), "utf8"),
      fs.readFile(path.join(root, "CHANGELOG.md"), "utf8")
    ]);

    expect(releaseProcess).toContain("validate:release");
    expect(contributing).toContain("validate:local");
    expect(changelog).toContain("Unreleased");
  });
});
