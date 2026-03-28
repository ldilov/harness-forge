import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("recursive release validation contract", () => {
  it("registers recursive structured-analysis artifacts and package-surface paths", async () => {
    const [flowArtifactsRaw, packageSurfaceRaw, docValidatorRaw, releaseSmokeRaw] = await Promise.all([
      fs.readFile(path.join(root, "manifests", "catalog", "flow-artifacts.json"), "utf8"),
      fs.readFile(path.join(root, "manifests", "catalog", "package-surface.json"), "utf8"),
      fs.readFile(path.join(root, "scripts", "ci", "validate-doc-command-alignment.mjs"), "utf8"),
      fs.readFile(path.join(root, "scripts", "ci", "release-smoke.mjs"), "utf8")
    ]);

    const flowArtifacts = JSON.parse(flowArtifactsRaw) as { artifacts: Array<{ id: string }> };
    const packageSurface = JSON.parse(packageSurfaceRaw) as { requiredPaths: string[] };

    const artifactIds = new Set(flowArtifacts.artifacts.map((artifact) => artifact.id));
    expect(artifactIds.has("recursive-runtime-language-capabilities")).toBe(true);
    expect(artifactIds.has("recursive-runtime-execution-policy")).toBe(true);
    expect(artifactIds.has("recursive-runtime-session-capabilities")).toBe(true);
    expect(artifactIds.has("recursive-runtime-run-meta")).toBe(true);
    expect(artifactIds.has("recursive-runtime-run-result")).toBe(true);
    expect(packageSurface.requiredPaths).toContain(".agents/skills/recursive-structured-analysis/SKILL.md");
    expect(packageSurface.requiredPaths).toContain("skills/recursive-structured-analysis/SKILL.md");
    expect(packageSurface.requiredPaths).toContain("schemas/runtime/recursive-language-capabilities.schema.json");
    expect(packageSurface.requiredPaths).toContain("schemas/runtime/recursive-run-result.schema.json");
    expect(docValidatorRaw).toContain("recursive capabilities");
    expect(docValidatorRaw).toContain("recursive inspect-run");
    expect(releaseSmokeRaw).toContain("recursive-capabilities");
    expect(releaseSmokeRaw).toContain("recursive-run");
  });
});
