import path from "node:path";

import { buildOrientationPack } from "../runtime/build-orientation-pack.js";
import { buildSurfaceTierIndex } from "../runtime/build-surface-tiers.js";
import type { InstallPlan } from "../../domain/operations/install-plan.js";
import type { RepoIntelligenceResult } from "../../domain/intelligence/repo-intelligence.js";
import type { ProfileManifest } from "../../domain/manifests/index.js";
import type { InstalledPacksDocument } from "../../domain/runtime/installed-packs.js";
import type { MaterializationIndexDocument } from "../../domain/runtime/materialization-index.js";
import type { RecommendationEvidenceDocument } from "../../domain/runtime/recommendation-evidence.js";
import type { SelectedProfileDocument } from "../../domain/runtime/selected-profile.js";
import {
  AI_LAYER_MANIFESTS_DIR,
  INSTALLED_PACKS_FILE,
  MATERIALIZATION_INDEX_FILE,
  RECOMMENDATION_EVIDENCE_FILE,
  RUNTIME_DIR,
  RUNTIME_RECOMMENDATIONS_FILE,
  RUNTIME_REPO_DIR,
  RUNTIME_SCHEMA_VERSION,
  SELECTED_PROFILE_FILE,
  exists,
  readJsonFile,
  writeJsonFile
} from "../../shared/index.js";
import { mapBundlesToPackManifests } from "./load-pack-manifests.js";
import { buildRecommendationEvidence } from "./resolve-profile.js";

export async function writeRuntimeManifests(
  root: string,
  plan: InstallPlan,
  packageVersion: string,
  profiles: ProfileManifest[]
): Promise<{
  installedPacksPath: string;
  selectedProfilePath?: string;
  materializationIndexPath: string;
  recommendationEvidencePath: string;
}> {
  const manifestsRoot = path.join(root, AI_LAYER_MANIFESTS_DIR);
  const recommendationPath = path.join(root, RUNTIME_DIR, RUNTIME_REPO_DIR, RUNTIME_RECOMMENDATIONS_FILE);
  const packManifests = mapBundlesToPackManifests(
    [...new Set(plan.operations.map((operation) => operation.bundleId))].map((bundleId) => ({
      id: bundleId,
      family: "resolved",
      version: 1,
      description: `Resolved pack for ${bundleId}`,
      paths: plan.operations.filter((operation) => operation.bundleId === bundleId).map((operation) => operation.sourcePath),
      targets: [plan.selection.targetId],
      dependencies: [],
      conflicts: [],
      optional: true,
      defaultInstall: false,
      stability: "stable",
      tags: [],
      owner: "runtime"
    })),
    profiles
  );

  const installedPacks: InstalledPacksDocument = {
    runtimeSchemaVersion: RUNTIME_SCHEMA_VERSION,
    packageVersion,
    ...(plan.selection.profileId ? { profileId: plan.selection.profileId } : {}),
    packs: packManifests.map((pack) => ({
      packId: pack.packId,
      selectedBy: plan.selection.profileId ? "profile" : "explicit",
      sourceBundleIds: pack.sourceBundleIds
    }))
  };

  const materializationIndex: MaterializationIndexDocument = {
    generatedAt: new Date().toISOString(),
    entries: plan.operations.map((operation) => ({
      bundleId: operation.bundleId,
      destinationPath: operation.destinationPath,
      operationType: operation.type,
      sourcePath: operation.sourcePath
    }))
  };

  const installedPacksPath = path.join(manifestsRoot, INSTALLED_PACKS_FILE);
  const materializationIndexPath = path.join(manifestsRoot, MATERIALIZATION_INDEX_FILE);
  const intelligence: RepoIntelligenceResult | null =
    (await exists(recommendationPath)) ? await readJsonFile<RepoIntelligenceResult>(recommendationPath) : null;
  const recommendationEvidence: RecommendationEvidenceDocument = buildRecommendationEvidence(
    plan.selection.profileId,
    packManifests.map((pack) => pack.packId),
    intelligence
  );
  const recommendationEvidencePath = path.join(root, RUNTIME_DIR, RUNTIME_REPO_DIR, RECOMMENDATION_EVIDENCE_FILE);

  const orientationPack = buildOrientationPack(plan.selection.profileId ?? "runtime-standard");
  const surfaceTiers = buildSurfaceTierIndex([
    { surfacePath: "AGENTS.md", tier: "hot", defaultInclusion: true, dropOrderRank: 0 },
    { surfacePath: ".hforge/agent-manifest.json", tier: "hot", defaultInclusion: true, dropOrderRank: 1 },
    { surfacePath: ".hforge/runtime/index.json", tier: "hot", defaultInclusion: true, dropOrderRank: 2 },
    { surfacePath: ".hforge/library/skills", tier: "warm", defaultInclusion: false, dropOrderRank: 3 },
    { surfacePath: "coverage", tier: "cold", defaultInclusion: false, dropOrderRank: 10 }
  ]);
  const contextBudget = {
    schemaVersion: "1.0.0",
    maxFirstHopTokens: orientationPack.maxFirstHopTokens,
    hotSurfaces: orientationPack.requiredSurfaces,
    warmSurfaces: [".hforge/generated/agent-command-catalog.json", ".hforge/library/skills", ".hforge/library/rules"],
    coldSurfaces: ["coverage", "tests", ".tmp", "docs/authoring"],
    dropOrder: ["coverage", "tests", ".tmp", "docs/authoring"],
    profiles: {
      brief: { maxOutputTokens: 300, maxFindings: 3, deltaOnly: true },
      standard: { maxOutputTokens: 900, maxFindings: 7, deltaOnly: false },
      deep: { maxOutputTokens: 3000, maxFindings: 15, deltaOnly: false }
    }
  };

  await Promise.all([
    writeJsonFile(installedPacksPath, installedPacks),
    writeJsonFile(materializationIndexPath, materializationIndex),
    writeJsonFile(recommendationEvidencePath, recommendationEvidence),
    writeJsonFile(path.join(root, RUNTIME_DIR, "orientation-pack.json"), orientationPack),
    writeJsonFile(path.join(root, RUNTIME_DIR, "surface-tiers.json"), surfaceTiers),
    writeJsonFile(path.join(root, RUNTIME_DIR, "context-budget.json"), contextBudget)
  ]);

  let selectedProfilePath: string | undefined;
  if (plan.selection.profileId) {
    const profile = profiles.find((entry) => entry.id === plan.selection.profileId);
    const selectedProfile: SelectedProfileDocument = {
      profileId: plan.selection.profileId,
      ...(profile?.displayName ? { displayName: profile.displayName } : {}),
      bundleIds: profile?.bundleIds ?? [],
      generatedAt: new Date().toISOString()
    };
    selectedProfilePath = path.join(manifestsRoot, SELECTED_PROFILE_FILE);
    await writeJsonFile(selectedProfilePath, selectedProfile);
  }

  return {
    installedPacksPath,
    ...(selectedProfilePath ? { selectedProfilePath } : {}),
    materializationIndexPath,
    recommendationEvidencePath
  };
}
