import { Command } from "commander";

import { loadBundleManifests, loadProfileManifests, loadTargetManifests } from "../../domain/manifests/index.js";
import { loadInstallState, saveInstallState } from "../../domain/state/install-state.js";
import { createInstallPlan } from "../../application/install/plan-install.js";
import { applyInstall } from "../../application/install/apply-install.js";
import { validateEnvironment } from "../../application/install/validate-environment.js";
import { recommendBundles } from "../../application/recommendations/recommend-bundles.js";
import { REPO_ROOT, ValidationError } from "../../shared/index.js";
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
    .option("--root <root>", "workspace root", REPO_ROOT)
    .option("--json", "json output", false)
    .action(async (options) => {
      const [bundles, profiles, targets, recommendations] = await Promise.all([
        loadBundleManifests(options.root),
        loadProfileManifests(options.root),
        loadTargetManifests(options.root),
        recommendBundles(options.root)
      ]);

      const result = { bundles, profiles, targets, recommendations };
      console.log(options.json ? toJson(result) : JSON.stringify(result, null, 2));
    });

  program
    .command("list")
    .option("--root <root>", "workspace root", REPO_ROOT)
    .option("--json", "json output", false)
    .action(async (options) => {
      const [bundles, recommendations] = await Promise.all([
        loadBundleManifests(options.root),
        recommendBundles(options.root)
      ]);
      const result = {
        installed: (await loadInstallState(options.root))?.installedBundles ?? [],
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
    .option("--root <root>", "workspace root", REPO_ROOT)
    .option("--dry-run", "show plan only", false)
    .option("--yes", "apply plan", false)
    .option("--json", "json output", false)
    .action(async (options) => {
      const state = await loadInstallState(options.root);
      const targetId = options.target ?? state?.installedTargets[0];
      if (!targetId) {
        throw new ValidationError("Target is required for add until a baseline install exists.");
      }

      const warnings = await validateEnvironment(options.root, targetId);
      const [bundles, profiles, target] = await Promise.all([
        loadBundleManifests(options.root),
        loadProfileManifests(options.root),
        loadTargetAdapter(options.root, targetId)
      ]);

      const plan = createInstallPlan(
        options.root,
        {
          targetId,
          profileId: options.profile,
          bundleIds: unique([...(state?.installedBundles ?? []), ...options.bundle]),
          languageIds: options.lang,
          frameworkIds: options.framework,
          capabilityIds: options.with,
          rootPath: options.root,
          mode: options.yes && !options.dryRun ? "apply" : "dry-run"
        },
        bundles,
        profiles,
        target
      );

      plan.warnings.push(...warnings);

      if (options.json) {
        console.log(toJson(plan));
        return;
      }

      console.log(JSON.stringify(plan, null, 2));
      if (!options.dryRun && options.yes) {
        const result = await applyInstall(options.root, plan);
        console.log(result.messages.join("\n"));
        console.log(`Guidance written to ${result.guidancePath}`);
      } else {
        console.log('Preview only. Re-run with "--yes" to apply the plan.');
      }
    });

  program
    .command("remove")
    .argument("<bundleId...>")
    .option("--root <root>", "workspace root", REPO_ROOT)
    .option("--dry-run", "preview only", false)
    .option("--yes", "apply removal to install state", false)
    .option("--json", "json output", false)
    .action(async (bundleIds: string[], options) => {
      const state = await loadInstallState(options.root);
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
        await saveInstallState(options.root, {
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
