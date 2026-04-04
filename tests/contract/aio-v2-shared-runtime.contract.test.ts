import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

async function readJson<T>(relativePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(path.join(root, relativePath), "utf8")) as T;
}

describe("aio v2 shared runtime contract", () => {
  it("declares shared runtime artifacts and target bridge metadata", async () => {
    const [flowArtifacts, codexAdapter, claudeAdapter, cursorAdapter, opencodeAdapter] = await Promise.all([
      readJson<{ artifacts: Array<{ id: string; pathPattern: string }> }>("manifests/catalog/flow-artifacts.json"),
      readJson<{ sharedRuntimeBridge?: { instructionSurfaces: string[]; runtimeSurfaces?: string[] } }>(
        "targets/codex/adapter.json"
      ),
      readJson<{ sharedRuntimeBridge?: { instructionSurfaces: string[]; runtimeSurfaces?: string[] } }>(
        "targets/claude-code/adapter.json"
      ),
      readJson<{ sharedRuntimeBridge?: { instructionSurfaces: string[]; runtimeSurfaces?: string[] } }>(
        "targets/cursor/adapter.json"
      ),
      readJson<{ sharedRuntimeBridge?: { instructionSurfaces: string[]; runtimeSurfaces?: string[] } }>(
        "targets/opencode/adapter.json"
      )
    ]);

    const artifactIds = new Set(flowArtifacts.artifacts.map((artifact) => artifact.id));
    expect(artifactIds.has("agent-manifest")).toBe(true);
    expect(artifactIds.has("shared-runtime-index")).toBe(true);
    expect(artifactIds.has("shared-runtime-readme")).toBe(true);
    expect(artifactIds.has("shared-runtime-repo-map")).toBe(true);
    expect(artifactIds.has("shared-runtime-recommendations")).toBe(true);
    expect(artifactIds.has("shared-runtime-recommendation-evidence")).toBe(true);
    expect(artifactIds.has("shared-runtime-target-support")).toBe(true);
    expect(artifactIds.has("shared-runtime-instruction-plan")).toBe(true);
    expect(artifactIds.has("shared-runtime-scan-summary")).toBe(true);
    expect(artifactIds.has("shared-runtime-validation-gaps")).toBe(true);
    expect(artifactIds.has("shared-runtime-risk-signals")).toBe(true);
    expect(artifactIds.has("hidden-ai-layer-skills")).toBe(true);
    expect(artifactIds.has("hidden-ai-layer-rules")).toBe(true);
    expect(artifactIds.has("hidden-ai-layer-knowledge")).toBe(true);
    expect(artifactIds.has("hidden-ai-layer-templates")).toBe(true);

    for (const adapter of [codexAdapter, claudeAdapter, cursorAdapter, opencodeAdapter]) {
      expect(adapter.sharedRuntimeBridge?.instructionSurfaces.length ?? 0).toBeGreaterThan(0);
      expect(adapter.sharedRuntimeBridge?.runtimeSurfaces?.includes(".hforge/runtime/index.json")).toBe(true);
      expect(adapter.sharedRuntimeBridge?.runtimeSurfaces?.includes(".hforge/runtime/README.md")).toBe(true);
    }
  });

  it("documents the shared runtime in operator-facing guidance", async () => {
    const [agents, installation, targets] = await Promise.all([
      fs.readFile(path.join(root, "AGENTS.md"), "utf8"),
      fs.readFile(path.join(root, "docs", "installation.md"), "utf8"),
      fs.readFile(path.join(root, "docs", "install", "targets.md"), "utf8")
    ]);

    for (const content of [agents, installation, targets]) {
      expect(content).toContain(".hforge/runtime");
    }

    expect(agents).toContain(".hforge/agent-manifest.json");
    expect(agents).toContain(".hforge/library/skills/");
    expect(installation).toContain(".hforge/agent-manifest.json");
    expect(installation).toContain(".hforge/library/skills/");
    expect(targets).toContain(".hforge/library/");
    expect(installation).toContain(".hforge/runtime/findings/risk-signals.json");
    expect(targets).toContain(".hforge/runtime/repo/instruction-plan.json");
  });
});
