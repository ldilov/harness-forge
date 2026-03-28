import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("github workflows contract", () => {
  it("ships CI and npm release workflows", async () => {
    const ciWorkflow = await fs.readFile(path.join(root, ".github", "workflows", "ci.yml"), "utf8");
    const releaseWorkflow = await fs.readFile(
      path.join(root, ".github", "workflows", "release-package.yml"),
      "utf8"
    );
    const securityWorkflow = await fs.readFile(path.join(root, ".github", "workflows", "security.yml"), "utf8");

    expect(ciWorkflow).toContain("npm ci");
    expect(ciWorkflow).toContain("npm run build");
    expect(ciWorkflow).toContain("npm test");
    expect(ciWorkflow).toContain("validate:local");
    expect(ciWorkflow).toContain("npm run validate:release");
    expect(ciWorkflow).toContain("smoke:cli");

    expect(releaseWorkflow).toContain("workflow_dispatch");
    expect(releaseWorkflow).toContain("push:");
    expect(releaseWorkflow).toContain("tags:");
    expect(releaseWorkflow).toContain("npm pack");
    expect(releaseWorkflow).toContain("release:dry-run");
    expect(releaseWorkflow).toContain("npm publish --access public");
    expect(releaseWorkflow).toContain("NODE_AUTH_TOKEN");

    expect(securityWorkflow).toContain("npm audit --omit=dev");
    expect(securityWorkflow).toContain("validate:package-surface");
  });
});
