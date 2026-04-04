import path from "node:path";
import { Command } from "commander";

import { applyInstall } from "../../application/install/apply-install.js";
import { createInstallPlan } from "../../application/install/plan-install.js";
import { loadBundleManifests, loadProfileManifests } from "../../domain/manifests/index.js";
import type { RecommendationEvidenceDocument } from "../../domain/runtime/recommendation-evidence.js";
import { loadInstallState, saveInstallState } from "../../domain/state/install-state.js";
import { loadTargetAdapter } from "../../domain/targets/adapter.js";
import { mapBundlesToPackManifests } from "../../application/install/load-pack-manifests.js";
import { summarizePackFootprint } from "../../application/runtime/pack-footprint.js";
import { explainSurface } from "../../application/runtime/explain-surface.js";
import { resolveTaskArtifactPaths } from "../../application/runtime/task-runtime-store.js";
import {
  DEFAULT_WORKSPACE_ROOT,
  PACKAGE_ROOT,
  RECOMMENDATION_EVIDENCE_FILE,
  RUNTIME_DIR,
  RUNTIME_REPO_DIR,
  ValidationError,
  exists,
  readJsonFile
} from "../../shared/index.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";

async function loadRecommendationEvidence(workspaceRoot: string): Promise<RecommendationEvidenceDocument | null> {
  const evidencePath = path.join(workspaceRoot, RUNTIME_DIR, RUNTIME_REPO_DIR, RECOMMENDATION_EVIDENCE_FILE);
  if (!(await exists(evidencePath))) {
    return null;
  }
  return readJsonFile<RecommendationEvidenceDocument>(evidencePath);
}

export function registerPackCommands(program: Command): void {
  const pack = program.command("pack").description("Inspect and manage installed runtime packs.");

  pack
    .command("list")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (options) => {
      const workspaceRoot = path.resolve(options.root);
      const [bundles, profiles, state, evidence] = await Promise.all([
        loadBundleManifests(PACKAGE_ROOT),
        loadProfileManifests(PACKAGE_ROOT),
        loadInstallState(workspaceRoot),
        loadRecommendationEvidence(workspaceRoot)
      ]);
      const packs = mapBundlesToPackManifests(bundles, profiles);
      const installedIds = new Set(state?.installedBundles ?? []);
      const result = {
        workspaceRoot,
        installed: packs.filter((entry) => installedIds.has(entry.packId)),
        available: packs,
        footprint: summarizePackFootprint(bundles),
        recommendationEvidence: evidence?.records.filter((record) => record.subjectType === "pack") ?? []
      };
      console.log(options.json ? toJson(result) : JSON.stringify(result, null, 2));
    });

  pack
    .command("inspect <identifier>")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (identifier, options) => {
      const workspaceRoot = path.resolve(options.root);
      const [bundles, profiles, evidence] = await Promise.all([
        loadBundleManifests(PACKAGE_ROOT),
        loadProfileManifests(PACKAGE_ROOT),
        loadRecommendationEvidence(workspaceRoot)
      ]);
      const packManifest = mapBundlesToPackManifests(bundles, profiles).find((entry) => entry.packId === identifier);
      if (packManifest) {
        const footprint = summarizePackFootprint(bundles).find((entry) => entry.packId === identifier) ?? null;
        const result = {
          pack: packManifest,
          footprint,
          recommendationEvidence:
            evidence?.records.filter((record) => record.subjectType === "pack" && record.subjectId === identifier) ?? []
        };
        console.log(options.json ? toJson(result) : JSON.stringify(result, null, 2));
        return;
      }

      const paths = resolveTaskArtifactPaths(workspaceRoot, identifier);
      if (!(await exists(paths.taskPackPath))) {
        throw new ValidationError(`Pack manifest or task pack not found for ${identifier}.`);
      }

      const result = {
        taskId: identifier,
        taskPackPath: paths.taskPackPath,
        taskPack: await readJsonFile(paths.taskPackPath)
      };
      console.log(options.json ? toJson(result) : JSON.stringify(result, null, 2));
    });

  pack
    .command("explain <packId>")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (packId, options) => {
      const workspaceRoot = path.resolve(options.root);
      const [bundles, profiles, state, evidence] = await Promise.all([
        loadBundleManifests(PACKAGE_ROOT),
        loadProfileManifests(PACKAGE_ROOT),
        loadInstallState(workspaceRoot),
        loadRecommendationEvidence(workspaceRoot)
      ]);
      const bundle = bundles.find((entry) => entry.id === packId);
      const packManifest = mapBundlesToPackManifests(bundles, profiles).find((entry) => entry.packId === packId);
      if (!bundle || !packManifest) {
        throw new ValidationError(`Pack ${packId} not found.`);
      }

      const sampleSurface = bundle.paths[0]
        ? await explainSurface(workspaceRoot, bundle.paths[0])
        : null;
      const result = {
        packId,
        installed: (state?.installedBundles ?? []).includes(packId),
        dependsOn: bundle.dependencies,
        conflictsWith: bundle.conflicts,
        managedRoots: packManifest.managedRoots,
        footprint: summarizePackFootprint([bundle])[0],
        sampleSurface,
        recommendationEvidence:
          evidence?.records.filter((record) => record.subjectType === "pack" && record.subjectId === packId) ?? []
      };
      console.log(options.json ? toJson(result) : JSON.stringify(result, null, 2));
    });

  pack
    .command("add <packId...>")
    .option("--target <target>", "target adapter to install into")
    .option("--profile <profile>")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--dry-run", "preview only", false)
    .option("--yes", "apply plan", false)
    .option("--json", "json output", false)
    .action(async (packIds: string[], options) => {
      const workspaceRoot = path.resolve(options.root);
      const state = await loadInstallState(workspaceRoot);
      const targetId = options.target ?? state?.installedTargets[0];
      if (!targetId) {
        throw new ValidationError("Target is required for pack add until a baseline install exists.");
      }

      const [bundles, profiles, target] = await Promise.all([
        loadBundleManifests(PACKAGE_ROOT),
        loadProfileManifests(PACKAGE_ROOT),
        loadTargetAdapter(PACKAGE_ROOT, targetId)
      ]);
      const plan = createInstallPlan(
        PACKAGE_ROOT,
        {
          targetId,
          profileId: options.profile ?? state?.setupProfile,
          bundleIds: [...new Set([...(state?.installedBundles ?? []), ...packIds])],
          languageIds: [],
          frameworkIds: [],
          capabilityIds: [],
          rootPath: workspaceRoot,
          mode: options.yes && !options.dryRun ? "apply" : "dry-run"
        },
        bundles,
        profiles,
        target,
        { workspaceRoot }
      );

      if (options.json) {
        console.log(toJson(plan));
        return;
      }

      console.log(JSON.stringify(plan, null, 2));
      if (!options.dryRun && options.yes) {
        const result = await applyInstall(workspaceRoot, plan);
        console.log(result.messages.join("\n"));
      } else {
        console.log('Preview only. Re-run with "--yes" to apply the plan.');
      }
    });

  pack
    .command("remove <packId...>")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--dry-run", "preview only", false)
    .option("--yes", "apply removal to install state", false)
    .option("--json", "json output", false)
    .action(async (packIds: string[], options) => {
      const workspaceRoot = path.resolve(options.root);
      const state = await loadInstallState(workspaceRoot);
      if (!state) {
        throw new ValidationError("No install state found. Install a baseline target before removing packs.");
      }

      const removalSet = new Set(packIds);
      const nextBundles = state.installedBundles.filter((bundleId) => !removalSet.has(bundleId));
      const result = {
        removed: packIds,
        before: state.installedBundles,
        after: nextBundles,
        notes: [
          "Pack removal updates install state immediately.",
          "Generated file cleanup remains conservative and may require refresh or reinstall."
        ]
      };

      if (!options.dryRun && options.yes) {
        await saveInstallState(workspaceRoot, {
          ...state,
          installedBundles: nextBundles,
          timestamps: {
            ...state.timestamps,
            updatedAt: new Date().toISOString()
          }
        });
      }

      console.log(options.json ? toJson(result) : JSON.stringify(result, null, 2));
      if (options.dryRun || !options.yes) {
        console.log('Preview only. Re-run with "--yes" to persist the updated install state.');
      }
    });

  pack
    .command("sync")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (options) => {
      const workspaceRoot = path.resolve(options.root);
      const state = await loadInstallState(workspaceRoot);
      const result = {
        workspaceRoot,
        installedPacks: state?.installedBundles ?? [],
        status: "ok",
        note: "Use refresh or update to rewrite managed runtime artifacts after pack changes."
      };
      console.log(options.json ? toJson(result) : JSON.stringify(result, null, 2));
    });
}
