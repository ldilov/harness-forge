import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

async function readJson<T>(relativePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(path.join(root, relativePath), "utf8")) as T;
}

describe("aio v2 hidden ai layer contract", () => {
  it("declares hidden canonical artifact families and a thin visible bridge policy", async () => {
    const [flowArtifacts, packageSurface, codexAdapter, claudeAdapter, cursorAdapter, opencodeAdapter] = await Promise.all([
      readJson<{ artifacts: Array<{ id: string }> }>("manifests/catalog/flow-artifacts.json"),
      readJson<{
        installModel?: {
          defaultTrackingMode: string;
          canonicalHiddenRoots: string[];
          visibleBridgeRoots: string[];
        };
      }>("manifests/catalog/package-surface.json"),
      readJson<{ sharedRuntimeBridge?: { authoritativeSurfaces?: string[]; visibleBridgePaths?: string[]; visibilityMode?: string } }>(
        "targets/codex/adapter.json"
      ),
      readJson<{ sharedRuntimeBridge?: { authoritativeSurfaces?: string[]; visibleBridgePaths?: string[]; visibilityMode?: string } }>(
        "targets/claude-code/adapter.json"
      ),
      readJson<{ sharedRuntimeBridge?: { authoritativeSurfaces?: string[]; visibleBridgePaths?: string[]; visibilityMode?: string } }>(
        "targets/cursor/adapter.json"
      ),
      readJson<{ sharedRuntimeBridge?: { authoritativeSurfaces?: string[]; visibleBridgePaths?: string[]; visibilityMode?: string } }>(
        "targets/opencode/adapter.json"
      )
    ]);

    const artifactIds = new Set(flowArtifacts.artifacts.map((artifact) => artifact.id));
    expect(artifactIds.has("hidden-ai-layer-skills")).toBe(true);
    expect(artifactIds.has("hidden-ai-layer-rules")).toBe(true);
    expect(artifactIds.has("hidden-ai-layer-knowledge")).toBe(true);
    expect(artifactIds.has("hidden-ai-layer-templates")).toBe(true);

    expect(packageSurface.installModel?.defaultTrackingMode).toBe("local-first");
    expect(packageSurface.installModel?.canonicalHiddenRoots).toContain(".hforge/library/skills");
    expect(packageSurface.installModel?.canonicalHiddenRoots).toContain(".hforge/library/rules");
    expect(packageSurface.installModel?.canonicalHiddenRoots).toContain(".hforge/library/knowledge");
    expect(packageSurface.installModel?.visibleBridgeRoots).toContain(".agents/skills");
    expect(packageSurface.installModel?.visibleBridgeRoots).toContain(".specify");

    for (const adapter of [codexAdapter, claudeAdapter, cursorAdapter, opencodeAdapter]) {
      expect(adapter.sharedRuntimeBridge?.visibilityMode).toBe("hidden-ai-layer");
      expect(adapter.sharedRuntimeBridge?.authoritativeSurfaces).toContain(".hforge/library/skills");
      expect(adapter.sharedRuntimeBridge?.authoritativeSurfaces).toContain(".hforge/templates");
      expect(adapter.sharedRuntimeBridge?.visibleBridgePaths).toContain(".agents/skills");
    }
  });
});
