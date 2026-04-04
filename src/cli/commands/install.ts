import { Command } from "commander";

import path from "node:path";

import { loadBundleManifests, loadProfileManifests } from "../../domain/manifests/index.js";
import { loadTargetAdapter } from "../../domain/targets/adapter.js";
import { bootstrapWorkspace } from "../../application/install/bootstrap-workspace.js";
import { createInstallPlan } from "../../application/install/plan-install.js";
import { applyInstall } from "../../application/install/apply-install.js";
import { validateEnvironment } from "../../application/install/validate-environment.js";
import { appendEffectivenessSignal } from "../../infrastructure/observability/local-metrics-store.js";
import { formatPlanSummary, toJson } from "../../infrastructure/diagnostics/reporter.js";
import { formatPostInstallSummary } from "../../application/runtime/format-post-install-summary.js";
import { PACKAGE_ROOT, DEFAULT_WORKSPACE_ROOT, RUNTIME_DIR, RUNTIME_REPO_DIR, ONBOARDING_BRIEF_FILE, readJsonFile, exists } from "../../shared/index.js";
import type { OnboardingBrief } from "../../domain/runtime/onboarding-brief.js";

function collect(value: string, previous: string[]): string[] {
  previous.push(value);
  return previous;
}

export function registerInstallCommands(program: Command): void {
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
        if (result.briefPath && await exists(result.briefPath)) {
          const brief = await readJsonFile<OnboardingBrief>(result.briefPath);
          console.log(formatPostInstallSummary(brief, result.briefPath));
        } else {
          console.log('Next: npx @harness-forge/cli shell setup --yes | npm install -g @harness-forge/cli');
        }
      } else {
        console.log('Preview only. Re-run with "--yes" to apply the plan.');
      }
    });

  program
    .command("bootstrap")
    .option("--target <target>", "explicit target override", collect, [])
    .option("--profile <profile>")
    .option("--lang <lang>", "language bundle", collect, [])
    .option("--framework <framework>", "framework bundle", collect, [])
    .option("--with <capability>", "capability bundle", collect, [])
    .option("--bundle <bundle>", "explicit bundle", collect, [])
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--dry-run", "show bootstrap plans only", false)
    .option("--yes", "apply detected bootstrap plans", false)
    .option("--json", "json output", false)
    .action(async (options) => {
      const workspaceRoot = path.resolve(options.root);
      const result = await bootstrapWorkspace({
        packageRoot: PACKAGE_ROOT,
        workspaceRoot,
        profileId: options.profile,
        targetIds: options.target,
        bundleIds: options.bundle,
        languageIds: options.lang,
        frameworkIds: options.framework,
        capabilityIds: options.with,
        mode: options.yes && !options.dryRun ? "apply" : "dry-run"
      });

      if (options.json) {
        console.log(toJson(result));
        return;
      }

      console.log(`Workspace: ${result.workspaceRoot}`);
      console.log(`Targets: ${result.targetIds.join(", ")}`);
      console.log(`Profile: ${result.recommendedProfileId}`);
      console.log(`Recommended bundles: ${result.recommendedBundleIds.join(", ") || "none"}`);
      if (result.discoveredTargets.length > 0) {
        console.log("Discovered targets:");
        for (const target of result.discoveredTargets) {
          const evidence = target.evidence.length > 0 ? ` via ${target.evidence.join(", ")}` : "";
          console.log(`- ${target.targetId} (${target.source}, ${target.confidence.toFixed(2)}): ${target.reason}${evidence}`);
        }
      }

      for (const plan of result.plans) {
        console.log("");
        console.log(formatPlanSummary(plan));
      }

      if (result.applied.length > 0) {
        await appendEffectivenessSignal(workspaceRoot, {
          signalType: "bootstrap-run",
          subjectId: "bootstrap",
          result: "success",
          recordedAt: new Date().toISOString(),
          details: { targetCount: result.applied.length },
          category: "firstRun",
          confidenceLevel: "direct"
        });

        for (const applied of result.applied) {
          console.log("");
          console.log(`Applied ${applied.targetId}`);
          console.log(applied.messages.join("\n"));
          console.log(`Guidance written to ${applied.guidancePath}`);
        }
        const briefPath = path.join(workspaceRoot, RUNTIME_DIR, RUNTIME_REPO_DIR, ONBOARDING_BRIEF_FILE);
        if (await exists(briefPath)) {
          const brief = await readJsonFile<OnboardingBrief>(briefPath);
          console.log(formatPostInstallSummary(brief, briefPath));
        } else {
          console.log('Next: npx @harness-forge/cli shell setup --yes | npm install -g @harness-forge/cli');
        }
      } else {
        console.log('Preview only. Re-run with "--yes" to apply the bootstrap plans.');
      }
    });
}
