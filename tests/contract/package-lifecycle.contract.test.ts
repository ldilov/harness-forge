import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("package lifecycle contract", () => {
  it("keeps zero-build npx surfaces wired for published and git-sourced installs", async () => {
    const packageJson = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"));

    expect(packageJson.bin?.hforge).toBe("./dist/cli/index.js");
    expect(packageJson.files).toContain("dist");
    expect(packageJson.scripts?.prepare).toBe("npm run build");
    expect(packageJson.scripts?.prepack).toBe("npm run build");
    expect(packageJson.scripts?.prepublishOnly).toContain("npm run validate:release");
    expect(packageJson.scripts?.["smoke:cli"]).toContain("smoke-runner");
    expect(packageJson.scripts?.["validate:local"]).toContain("validate:package-surface");
    expect(packageJson.scripts?.["release:dry-run"]).toContain("npm pack --json --dry-run");
    expect(packageJson.scripts?.["recommend:current"]).toContain("recommend");
    expect(packageJson.scripts?.["target:codex"]).toContain("target inspect codex");
    expect(packageJson.scripts?.["observability:summary"]).toContain("observability summarize");
  });
});
