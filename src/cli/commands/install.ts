import { Command } from "commander";

import path from "node:path";

import { loadBundleManifests, loadProfileManifests, loadTargetManifests } from "../../domain/manifests/index.js";
import { loadTargetAdapter } from "../../domain/targets/adapter.js";
import { createInstallPlan } from "../../application/install/plan-install.js";
import { applyInstall } from "../../application/install/apply-install.js";
import { validateEnvironment } from "../../application/install/validate-environment.js";
import { formatPlanSummary, toJson } from "../../infrastructure/diagnostics/reporter.js";
import { ensureDir, PACKAGE_ROOT, DEFAULT_WORKSPACE_ROOT, STATE_DIR } from "../../shared/index.js";

function collect(value: string, previous: string[]): string[] {
  previous.push(value);
  return previous;
}

export function registerInstallCommands(program: Command): void {
  program
    .command("init")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (options) => {
      const workspaceRoot = path.resolve(options.root);
      const [profiles, targets] = await Promise.all([
        loadProfileManifests(PACKAGE_ROOT),
        loadTargetManifests(PACKAGE_ROOT)
      ]);
      const stateDir = path.join(workspaceRoot, STATE_DIR);
      await ensureDir(stateDir);

      const result = {
        root: workspaceRoot,
        stateDir,
        profiles: profiles.map((profile) => profile.id),
        targets: targets.map((target) => target.id)
      };

      if (options.json) {
        console.log(toJson(result));
        return;
      }

      console.log(`Initialized Harness Forge workspace at ${workspaceRoot}`);
      console.log(`Available targets: ${result.targets.join(", ")}`);
      console.log(`Starter profiles: ${result.profiles.join(", ")}`);
    });

  program
    .command("install")
    .requiredOption("--target <target>")
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
      const warnings = await validateEnvironment(PACKAGE_ROOT, options.target);
      const [bundles, profiles, target] = await Promise.all([
        loadBundleManifests(PACKAGE_ROOT),
        loadProfileManifests(PACKAGE_ROOT),
        loadTargetAdapter(PACKAGE_ROOT, options.target)
      ]);

      const plan = createInstallPlan(
        PACKAGE_ROOT,
        {
          targetId: options.target,
          profileId: options.profile,
          bundleIds: options.bundle,
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

      console.log(formatPlanSummary(plan));
      if (!options.dryRun && options.yes) {
        const result = await applyInstall(workspaceRoot, plan);
        console.log(result.messages.join("\n"));
        console.log(`Guidance written to ${result.guidancePath}`);
      } else {
        console.log('Preview only. Re-run with "--yes" to apply the plan.');
      }
    });
}
