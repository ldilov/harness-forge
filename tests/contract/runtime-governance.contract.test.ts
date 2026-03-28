import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("runtime governance contract", () => {
  it("keeps hook manifests, profiles, and compatibility data aligned", async () => {
    execFileSync(process.execPath, [path.join(root, "scripts", "ci", "generate-compatibility-matrix.mjs")], {
      cwd: root,
      encoding: "utf8"
    });

    const schema = JSON.parse(await fs.readFile(path.join(root, "schemas", "hooks", "hook.schema.json"), "utf8"));
    const hooksManifest = JSON.parse(await fs.readFile(path.join(root, "manifests", "hooks", "index.json"), "utf8")) as {
      hooks: Array<Record<string, unknown>>;
    };
    const flowArtifacts = JSON.parse(
      await fs.readFile(path.join(root, "manifests", "catalog", "flow-artifacts.json"), "utf8")
    ) as {
      artifacts: Array<{ id: string }>;
    };
    const packageSurface = JSON.parse(
      await fs.readFile(path.join(root, "manifests", "catalog", "package-surface.json"), "utf8")
    ) as {
      requiredPaths: string[];
    };
    const compatibilityMatrix = JSON.parse(
      await fs.readFile(path.join(root, "manifests", "catalog", "compatibility-matrix.json"), "utf8")
    ) as {
      entries: Array<{ subjectType: string; relatedType: string; supportLevel: string; notes?: string }>;
    };
    const codexAdapter = JSON.parse(await fs.readFile(path.join(root, "targets", "codex", "adapter.json"), "utf8")) as {
      sharedRuntimeBridge?: {
        instructionSurfaces?: string[];
        runtimeSurfaces?: string[];
        authoritativeSurfaces?: string[];
        visibleBridgePaths?: string[];
        visibilityMode?: string;
      };
    };
    const claudeAdapter = JSON.parse(
      await fs.readFile(path.join(root, "targets", "claude-code", "adapter.json"), "utf8")
    ) as {
      sharedRuntimeBridge?: {
        instructionSurfaces?: string[];
        runtimeSurfaces?: string[];
        authoritativeSurfaces?: string[];
        visibleBridgePaths?: string[];
        visibilityMode?: string;
      };
    };
    const bundleFiles = await fs.readdir(path.join(root, "manifests", "bundles"));
    const profileFiles = await fs.readdir(path.join(root, "manifests", "profiles"));

    const bundles = (
      await Promise.all(
        bundleFiles.map(async (file) =>
          JSON.parse(await fs.readFile(path.join(root, "manifests", "bundles", file), "utf8")) as {
            bundles: Array<{ id: string }>;
          }
        )
      )
    ).flatMap((manifest) => manifest.bundles);
    const profiles = (
      await Promise.all(
        profileFiles.map(async (file) =>
          JSON.parse(await fs.readFile(path.join(root, "manifests", "profiles", file), "utf8")) as {
            profiles: Array<{ id: string; bundleIds: string[]; recommendedHooks?: string[] }>;
          }
        )
      )
    ).flatMap((manifest) => manifest.profiles);

    const ajv = new Ajv2020({ allErrors: true });
    const validate = ajv.compile(schema);
    const bundleIds = new Set(bundles.map((bundle) => bundle.id));
    const hookIds = new Set(hooksManifest.hooks.map((hook) => String(hook.id)));
    const flowArtifactIds = new Set(flowArtifacts.artifacts.map((artifact) => artifact.id));

    for (const hook of hooksManifest.hooks) {
      expect(validate(hook), JSON.stringify(validate.errors)).toBe(true);
    }

    for (const profile of profiles) {
      for (const bundleId of profile.bundleIds) {
        expect(bundleIds.has(bundleId), `${profile.id}:${bundleId}`).toBe(true);
      }
      for (const hookId of profile.recommendedHooks ?? []) {
        expect(hookIds.has(hookId), `${profile.id}:${hookId}`).toBe(true);
      }
    }

    expect(compatibilityMatrix.entries.some((entry) => entry.relatedType === "bundle")).toBe(true);
    expect(compatibilityMatrix.entries.some((entry) => entry.relatedType === "hook")).toBe(true);
    expect(compatibilityMatrix.entries.some((entry) => entry.relatedType === "skill")).toBe(true);
    expect(compatibilityMatrix.entries.some((entry) => entry.relatedType === "target")).toBe(true);
    expect(compatibilityMatrix.entries.some((entry) => entry.relatedType === "framework")).toBe(true);
    expect(codexAdapter.sharedRuntimeBridge?.instructionSurfaces?.length ?? 0).toBeGreaterThan(0);
    expect(claudeAdapter.sharedRuntimeBridge?.runtimeSurfaces).toContain(".hforge/runtime/index.json");
    expect(codexAdapter.sharedRuntimeBridge?.authoritativeSurfaces).toContain(".hforge/library/skills");
    expect(codexAdapter.sharedRuntimeBridge?.visibleBridgePaths).toContain(".agents/skills");
    expect(codexAdapter.sharedRuntimeBridge?.visibilityMode).toBe("hidden-ai-layer");
    expect(flowArtifactIds.has("shared-runtime-repo-map")).toBe(true);
    expect(flowArtifactIds.has("shared-runtime-risk-signals")).toBe(true);
    expect(flowArtifactIds.has("hidden-ai-layer-skills")).toBe(true);
    expect(flowArtifactIds.has("task-runtime-decision-record")).toBe(true);
    expect(flowArtifactIds.has("task-runtime-decision-index")).toBe(true);
    expect(flowArtifactIds.has("recursive-runtime-session")).toBe(true);
    expect(flowArtifactIds.has("recursive-runtime-summary")).toBe(true);
    expect(packageSurface.requiredPaths).toContain("schemas/runtime/architecture-significance.schema.json");
    expect(packageSurface.requiredPaths).toContain("schemas/runtime/decision-record.schema.json");
    expect(packageSurface.requiredPaths).toContain("schemas/runtime/decision-coverage-summary.schema.json");
    expect(packageSurface.requiredPaths).toContain("schemas/runtime/recursive-session.schema.json");
    expect(packageSurface.requiredPaths).toContain("schemas/templates/recursive-template-registry.schema.json");
    expect(
      compatibilityMatrix.entries.every(
        (entry) => entry.supportLevel === "full" || Boolean(entry.notes)
      )
    ).toBe(true);
  });
});
