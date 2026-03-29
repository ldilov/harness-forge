import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("package surface contract", () => {
  it("covers hidden and seeded publish roots in package.json", async () => {
    const packageJson = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"));

    expect(packageJson.files).toContain(".agents");
    expect(packageJson.files).toContain(".specify");
    expect(packageJson.files).toContain("knowledge-bases");
    expect(packageJson.files).toContain("scripts/templates");
    expect(packageJson.files).toContain("scripts/ci");
    expect(packageJson.files).toContain("AGENTS.md");
    expect(packageJson.files).toContain("skills");
  });

  it("declares required package-surface paths", async () => {
    const manifest = JSON.parse(await fs.readFile(path.join(root, "manifests/catalog/package-surface.json"), "utf8"));

    expect(manifest.requiredPaths).toContain("knowledge-bases/seeded/typescript");
    expect(manifest.requiredPaths).toContain(".specify/scripts/powershell/check-prerequisites.ps1");
    expect(manifest.requiredPaths).toContain(".agents/skills/speckit-implement/SKILL.md");
    expect(manifest.requiredPaths).toContain(".agents/skills/hforge-analyze/SKILL.md");
    expect(manifest.requiredPaths).toContain(".agents/skills/hforge-review/SKILL.md");
    expect(manifest.requiredPaths).toContain(".agents/skills/typescript-engineering/SKILL.md");
    expect(manifest.requiredPaths).toContain(".agents/skills/token-budget-optimizer/SKILL.md");
    expect(manifest.requiredPaths).toContain("commands/hforge-cartograph.md");
    expect(manifest.requiredPaths).toContain("commands/hforge-commands.md");
    expect(manifest.requiredPaths).toContain("commands/hforge-init.md");
    expect(manifest.requiredPaths).toContain("commands/hforge-recommend.md");
    expect(manifest.requiredPaths).toContain("commands/hforge-recursive.md");
    expect(manifest.requiredPaths).toContain("commands/hforge-review.md");
    expect(manifest.requiredPaths).toContain("commands/hforge-update.md");
    expect(manifest.requiredPaths).toContain("rules/common/README.md");
    expect(manifest.requiredPaths).toContain("skills/hforge-analyze/SKILL.md");
    expect(manifest.requiredPaths).toContain("skills/hforge-decide/SKILL.md");
    expect(manifest.requiredPaths).toContain("skills/token-budget-optimizer/SKILL.md");
    expect(manifest.requiredPaths).toContain("skills/typescript-engineering/SKILL.md");
    expect(manifest.requiredPaths).toContain("templates/workflows/implement-typescript-change.md");
    expect(manifest.requiredPaths).toContain("scripts/templates/README.md");
  });
});
