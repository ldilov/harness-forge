import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("docs and package release integration", () => {
  it("keeps release validation discoverable in AGENTS", async () => {
    const agents = await fs.readFile(path.join(root, "AGENTS.md"), "utf8");

    expect(agents).toContain("npm run validate:release");
    expect(agents).toContain(".hforge/library/knowledge/seeded/typescript/");
  });

  it("keeps codex and claude target surfaces in the package manifest", async () => {
    const manifest = JSON.parse(await fs.readFile(path.join(root, "manifests/catalog/package-surface.json"), "utf8"));
    const targets = Object.fromEntries(
      manifest.targetSurfaces.map((entry: { target: string; paths: string[] }) => [entry.target, entry.paths])
    );

    expect(targets.codex).toContain(".agents/skills");
    expect(targets["claude-code"]).toContain(".agents/skills");
  });
});
