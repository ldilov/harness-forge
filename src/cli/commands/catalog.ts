import { Command } from "commander";
import path from "node:path";

import { loadBundleManifests, loadProfileManifests, loadTargetManifests } from "../../domain/manifests/index.js";
import { loadInstallState, saveInstallState } from "../../domain/state/install-state.js";
import { createInstallPlan } from "../../application/install/plan-install.js";
import { applyInstall } from "../../application/install/apply-install.js";
import { validateEnvironment } from "../../application/install/validate-environment.js";
import { recommendBundles } from "../../application/recommendations/recommend-bundles.js";
import { PACKAGE_ROOT, DEFAULT_WORKSPACE_ROOT, ValidationError } from "../../shared/index.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";
import { loadTargetAdapter } from "../../domain/targets/adapter.js";

function collect(value: string, previous: string[]): string[] {
  previous.push(value);
  return previous;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function registerCatalogCommands(program: Command): void {
  program
    .command("catalog")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (options) => {
      const workspaceRoot = path.resolve(options.root);
      const [bundles, profiles, targets, recommendations] = await Promise.all([
        loadBundleManifests(PACKAGE_ROOT),
        loadProfileManifests(PACKAGE_ROOT),
        loadTargetManifests(PACKAGE_ROOT),
        recommendBundles(workspaceRoot)
      ]);

      const result = { bundles, profiles, targets, recommendations, workspaceRoot, packageRoot: PACKAGE_ROOT };
      console.log(options.json ? toJson(result) : JSON.stringify(result, null, 2));
    });

  program
    .command("list")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (options) => {
      const workspaceRoot = path.resolve(options.root);
      const [bundles, recommendations] = await Promise.all([
        loadBundleManifests(PACKAGE_ROOT),
        recommendBundles(workspaceRoot)
      ]);
      const result = {
        installed: (await loadInstallState(workspaceRoot))?.installedBundles ?? [],
        available: bundles.map((bundle) => bundle.id),
        recommended: recommendations
      };

      console.log(options.json ? toJson(result) : JSON.stringify(result, null, 2));
    });

  program
    .command("add")
    .option("--target <target>", "target adapter to install into")
    .option("--profile <profile>")
    .option("--lang <lang>", "language bundle", collect, [])
    .option("--framework <framework>", "framework bundle", collect, [])
    .option("--with <capability>", "capability bundle", collect, [])
    .option("--bundle <bundle>", "explicit bundle", collect, [])
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--dry-run", "show plan only", false)
    .option("--yes", "apply plan", false)
    .option("--json", "json output", false)
    .action(async (options) => {
      const workspaceRoot = path.resolve(options.root);
      const state = await loadInstallState(workspaceRoot);
      const targetId = options.target ?? state?.installedTargets[0];
      if (!targetId) {
        throw new ValidationError("Target is required for add until a baseline install exists.");
      }

      const warnings = await validateEnvironment(PACKAGE_ROOT, targetId);
      const [bundles, profiles, target] = await Promise.all([
        loadBundleManifests(PACKAGE_ROOT),
        loadProfileManifests(PACKAGE_ROOT),
        loadTargetAdapter(PACKAGE_ROOT, targetId)
      ]);

      const plan = createInstallPlan(
        PACKAGE_ROOT,
        {
          targetId,
          profileId: options.profile,
          bundleIds: unique([...(state?.installedBundles ?? []), ...options.bundle]),
          languageIds: options.lang,
          frameworkIds: options.framework,
          capabilityIds: options.with,
          rootPath: workspaceRoot,
          mode: options.yes && !options.dryRun ? "apply" : "dry-run"
        },
        bundles,
        profiles,
        target,
        { workspaceRoot }
      );

      plan.warnings.push(...warnings);

      if (options.json) {
        console.log(toJson(plan));
        return;
      }

      console.log(JSON.stringify(plan, null, 2));
      if (!options.dryRun && options.yes) {
        const result = await applyInstall(workspaceRoot, plan);
        console.log(result.messages.join("\n"));
        console.log(`Guidance written to ${result.guidancePath}`);
        console.log('Next: npx @harness-forge/cli shell setup --yes | npm install -g @harness-forge/cli');
      } else {
        console.log('Preview only. Re-run with "--yes" to apply the plan.');
      }
    });

  program
    .command("remove")
    .argument("<bundleId...>")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--dry-run", "preview only", false)
    .option("--yes", "apply removal to install state", false)
    .option("--json", "json output", false)
    .action(async (bundleIds: string[], options) => {
      const workspaceRoot = path.resolve(options.root);
      const state = await loadInstallState(workspaceRoot);
      if (!state) {
        throw new ValidationError("No install state found. Install a baseline target before removing bundles.");
      }

      const removalSet = new Set(bundleIds);
      const nextBundles = state.installedBundles.filter((bundleId) => !removalSet.has(bundleId));
      const result = {
        removed: bundleIds,
        before: state.installedBundles,
        after: nextBundles,
        notes: [
          "Bundle state can be removed automatically.",
          "File-level cleanup remains conservative and may require a follow-up repair or reinstall."
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
}
