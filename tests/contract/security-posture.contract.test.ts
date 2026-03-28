import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("security posture contract", () => {
  it("documents and configures the secure publish posture", async () => {
    const [packageJson, releaseProcess] = await Promise.all([
      fs.readFile(path.join(root, "package.json"), "utf8").then(JSON.parse),
      fs.readFile(path.join(root, "docs", "release-process.md"), "utf8")
    ]);

    expect(packageJson.engines.node).toBe(">=22");
    expect(packageJson.scripts["release:dry-run"]).toContain("npm pack --json --dry-run");
    expect(packageJson.scripts["validate:release"]).toContain("release-smoke");
    expect(releaseProcess).toContain("published from GitHub Actions");
    expect(releaseProcess).toContain("npm publish");
  });
});
