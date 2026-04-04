import path from "node:path";

import type { InstallPlan } from "../../domain/operations/install-plan.js";
import { applyOperation } from "../../infrastructure/filesystem/apply-operation.js";
import { loadInstallState, saveInstallState } from "../../domain/state/install-state.js";
import { loadProfileManifests } from "../../domain/manifests/index.js";
import { PACKAGE_ROOT, RUNTIME_SCHEMA_VERSION, readJsonFile, UPDATE_ACTION_PLAN_FILE, RUNTIME_DIR, RUNTIME_PROVENANCE_DIR, RUNTIME_REPO_DIR, ONBOARDING_BRIEF_FILE, FIRST_RUN_RESULT_FILE, writeJsonFile, writeTextFile } from "../../shared/index.js";
import { appendEffectivenessSignal } from "../../infrastructure/observability/local-metrics-store.js";
import { writeAgentCommandCatalog } from "../runtime/command-catalog.js";
import { generateOnboardingBrief } from "../runtime/generate-onboarding-brief.js";
import { generateFirstRunResult } from "../runtime/generate-first-run-result.js";
import { writeOnboardingBriefMarkdown } from "../runtime/render-onboarding-brief-md.js";
import { writeAgentManifest } from "./agent-manifest.js";
import { buildProvenanceIndex } from "./build-provenance-index.js";
import { ensureInstallGitignoreEntries } from "./ensure-gitignore.js";
import { generateGuidance } from "./generate-guidance.js";
import { planWorkspaceUpdate } from "./plan-workspace-update.js";
import { rewriteInstalledAiLayerReferences } from "./rewrite-installed-ai-layer.js";
import { writeSharedRuntime } from "./shared-runtime.js";
import { writeProvenanceIndex } from "./write-provenance-index.js";
import { writeRuntimeManifests } from "./write-runtime-manifests.js";

export interface ApplyInstallResult {
  messages: string[];
  guidancePath: string;
  briefPath?: string;
  firstRunResultPath?: string;
}

export async function applyInstall(
  root: string,
  plan: InstallPlan,
  packageRoot = PACKAGE_ROOT
): Promise<ApplyInstallResult> {
  const packageJson = await readJsonFile<{ version: string }>(path.join(packageRoot, "package.json"));
  const profiles = await loadProfileManifests(packageRoot);
  const visibilityPolicy = plan.visibilityPolicy ?? {
    mode: "hidden-ai-layer" as const,
    aiLayerRoot: path.join(root, ".hforge"),
    hiddenCanonicalRoots: [],
    visibleBridgePaths: []
  };
  const messages: string[] = [];

  try {
    await appendEffectivenessSignal(root, {
      signalType: "first-run-repo-analysis-completed",
      subjectId: plan.selection.targetId,
      result: "success",
      recordedAt: new Date().toISOString(),
      category: "firstRun",
      details: { targetId: plan.selection.targetId }
    });

    for (const operation of plan.operations) {
      messages.push(await applyOperation(operation));
    }

    await appendEffectivenessSignal(root, {
      signalType: "first-run-target-selected",
      subjectId: plan.selection.targetId,
      result: "success",
      recordedAt: new Date().toISOString(),
      category: "firstRun",
      details: { targetId: plan.selection.targetId, bundleCount: plan.operations.length }
    });

    const rewrittenFiles = await rewriteInstalledAiLayerReferences(root, plan);
    const gitignorePath = await ensureInstallGitignoreEntries(root);

    const guidance = generateGuidance(plan);
    const guidancePath = path.join(root, ".hforge", "state", "post-install-guidance.txt");
    await writeTextFile(guidancePath, guidance);
    const sharedRuntime = await writeSharedRuntime(root, plan, packageRoot);
    const runtimeManifests = await writeRuntimeManifests(root, plan, packageJson.version, profiles);
    const provenancePath = await writeProvenanceIndex(root, buildProvenanceIndex(root, plan));
    const updatePlanPath = path.join(root, RUNTIME_DIR, RUNTIME_PROVENANCE_DIR, UPDATE_ACTION_PLAN_FILE);
    await writeJsonFile(updatePlanPath, planWorkspaceUpdate(root, plan));

    await appendEffectivenessSignal(root, {
      signalType: "first-run-recommendation-generated",
      subjectId: plan.selection.targetId,
      result: "success",
      recordedAt: new Date().toISOString(),
      category: "firstRun",
      details: { bundleIds: plan.operations.map((op) => op.bundleId) }
    });

    const existingState = await loadInstallState(root);
    const commandCatalog = await writeAgentCommandCatalog(root, packageRoot);
    const agentManifestPath = path.join(root, ".hforge", "agent-manifest.json");
    const generatedFiles = [
      guidancePath,
      commandCatalog.jsonPath,
      commandCatalog.markdownPath,
      ...(gitignorePath ? [gitignorePath] : []),
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
          runtimeManifests.installedPacksPath,
          runtimeManifests.materializationIndexPath,
          runtimeManifests.recommendationEvidencePath,
          ...(runtimeManifests.selectedProfilePath ? [runtimeManifests.selectedProfilePath] : []),
          provenancePath,
          updatePlanPath,
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
    messages.push(`Installed pack manifests written to ${runtimeManifests.installedPacksPath}`);
    messages.push(`Recommendation evidence written to ${runtimeManifests.recommendationEvidencePath}`);
    messages.push(`Provenance index written to ${provenancePath}`);
    if (rewrittenFiles.length > 0) {
      messages.push(`Rewrote ${rewrittenFiles.length} installed bridge and hidden-layer files for contained path references`);
    }
    if (gitignorePath) {
      messages.push(`Updated ${gitignorePath} with local-first .hforge ignore entries`);
    }

    const detectedLanguages = plan.operations
      .filter((op) => op.bundleId.startsWith("lang:"))
      .map((op) => op.bundleId.replace("lang:", ""));
    const detectedFrameworks = plan.operations
      .filter((op) => op.bundleId.startsWith("framework:"))
      .map((op) => op.bundleId.replace("framework:", ""));
    const recommendedBundles = plan.operations.map((op) => op.bundleId);

    const brief = await generateOnboardingBrief({
      workspaceRoot: root,
      repoType: plan.selection.targetId,
      detectedLanguages: detectedLanguages.length > 0 ? detectedLanguages : [plan.selection.targetId],
      detectedFrameworks,
      keyBoundaries: [],
      selectedTargets: [plan.selection.targetId],
      selectedProfile: plan.selection.profileId ?? "recommended",
      recommendedBundles
    });
    const briefMdPath = await writeOnboardingBriefMarkdown(root, brief);
    const briefPath = path.join(root, RUNTIME_DIR, RUNTIME_REPO_DIR, ONBOARDING_BRIEF_FILE);

    const firstRunResult = await generateFirstRunResult({
      workspaceRoot: root,
      repoType: plan.selection.targetId,
      briefPath,
      generatedArtifacts: [...generatedFiles, briefPath, briefMdPath],
      targetPosture: plan.selection.targetId,
      primaryNextCommand: brief.nextBestCommand,
      partialSuccess: false,
      recoveryGuidance: null
    });

    const firstRunResultPath = path.join(root, RUNTIME_DIR, RUNTIME_REPO_DIR, FIRST_RUN_RESULT_FILE);

    await appendEffectivenessSignal(root, {
      signalType: "first-run-brief-generated",
      subjectId: plan.selection.targetId,
      result: "success",
      recordedAt: new Date().toISOString(),
      category: "firstRun",
      details: { briefPath, firstRunResultPath }
    });

    return { messages, guidancePath, briefPath, firstRunResultPath };
  } catch (error: unknown) {
    const recoveryMessage = error instanceof Error ? error.message : "Unknown install error";
    const briefPath = path.join(root, RUNTIME_DIR, RUNTIME_REPO_DIR, ONBOARDING_BRIEF_FILE);

    try {
      await generateFirstRunResult({
        workspaceRoot: root,
        repoType: plan.selection.targetId,
        briefPath,
        generatedArtifacts: [],
        targetPosture: plan.selection.targetId,
        primaryNextCommand: `hforge doctor --root ${root} --json`,
        partialSuccess: true,
        recoveryGuidance: `Install failed: ${recoveryMessage}. Run hforge doctor to diagnose.`
      });
    } catch {
      // Best-effort: if writing the first-run result itself fails, continue to throw original error
    }

    throw error;
  }
}
