import path from "node:path";

import type { InstallPlan } from "../../domain/operations/install-plan.js";
import { applyOperation } from "../../infrastructure/filesystem/apply-operation.js";
import { loadInstallState, saveInstallState } from "../../domain/state/install-state.js";
import { PACKAGE_ROOT, RUNTIME_SCHEMA_VERSION, readJsonFile, writeTextFile } from "../../shared/index.js";
import { writeAgentCommandCatalog } from "../runtime/command-catalog.js";
import { writeAgentManifest } from "./agent-manifest.js";
import { generateGuidance } from "./generate-guidance.js";
import { rewriteInstalledAiLayerReferences } from "./rewrite-installed-ai-layer.js";
import { writeSharedRuntime } from "./shared-runtime.js";

export async function applyInstall(
  root: string,
  plan: InstallPlan,
  packageRoot = PACKAGE_ROOT
): Promise<{ messages: string[]; guidancePath: string }> {
  const packageJson = await readJsonFile<{ version: string }>(path.join(packageRoot, "package.json"));
  const visibilityPolicy = plan.visibilityPolicy ?? {
    mode: "hidden-ai-layer" as const,
    aiLayerRoot: path.join(root, ".hforge"),
    hiddenCanonicalRoots: [],
    visibleBridgePaths: []
  };
  const messages: string[] = [];
  for (const operation of plan.operations) {
    messages.push(await applyOperation(operation));
  }

  const rewrittenFiles = await rewriteInstalledAiLayerReferences(root, plan);

  const guidance = generateGuidance(plan);
  const guidancePath = path.join(root, ".hforge", "state", "post-install-guidance.txt");
  await writeTextFile(guidancePath, guidance);
  const sharedRuntime = await writeSharedRuntime(root, plan, packageRoot);

  const existingState = await loadInstallState(root);
  const commandCatalog = await writeAgentCommandCatalog(root, packageRoot);
  const agentManifestPath = path.join(root, ".hforge", "agent-manifest.json");
  const generatedFiles = [
    guidancePath,
    commandCatalog.jsonPath,
    commandCatalog.markdownPath,
    ...(sharedRuntime
      ? [sharedRuntime.indexPath, sharedRuntime.readmePath, ...sharedRuntime.baselineArtifacts.map((artifact) => artifact.path)]
      : [])
  ];
  await saveInstallState(root, {
    version: existingState?.version ?? 2,
    packageVersion: packageJson.version,
    runtimeSchemaVersion: RUNTIME_SCHEMA_VERSION,
    installedTargets: [...new Set([...(existingState?.installedTargets ?? []), plan.selection.targetId])],
    installedBundles: [
      ...new Set([...(existingState?.installedBundles ?? []), ...plan.operations.map((operation) => operation.bundleId)])
    ],
    appliedPlanHash: plan.hash,
    fileWrites: [
      ...new Set([
        ...(existingState?.fileWrites ?? []),
        ...plan.operations.map((operation) => operation.destinationPath),
        ...rewrittenFiles,
        ...generatedFiles,
        agentManifestPath
      ])
    ],
    backupSnapshots: [...new Set([...(existingState?.backupSnapshots ?? []), ...plan.backupRequirements])],
    timestamps: {
      createdAt: existingState?.timestamps.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    lastValidationStatus: "unknown",
    visibilityMode: visibilityPolicy.mode,
    aiLayerRoot: visibilityPolicy.aiLayerRoot,
    hiddenCanonicalRoots: visibilityPolicy.hiddenCanonicalRoots,
    visibleBridgePaths: visibilityPolicy.visibleBridgePaths,
    lastAction: "install",
    recoveryHints:
      existingState?.recoveryHints ?? [
        `Use "hforge doctor --root ${root}" to inspect missing or drifted managed surfaces.`,
        `Use "hforge refresh --root ${root}" to rewrite shared runtime summaries after install changes.`
      ]
  });
  const agentManifest = await writeAgentManifest(root, packageRoot);
  messages.push(`Agent command catalog written to ${commandCatalog.jsonPath}`);
  messages.push(`Agent manifest written to ${agentManifest.path}`);
  if (sharedRuntime) {
    messages.push(`Shared runtime written to ${sharedRuntime.indexPath}`);
  }
  if (rewrittenFiles.length > 0) {
    messages.push(`Rewrote ${rewrittenFiles.length} installed bridge and hidden-layer files for contained path references`);
  }

  return { messages, guidancePath };
}
