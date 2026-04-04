import fs from "node:fs/promises";
import path from "node:path";
import { Command } from "commander";

import { analyzeBridgeSurface } from "../../application/runtime/analyze-bridge-surfaces.js";
import { detectDuplicateInventory } from "../../application/runtime/detect-duplicates.js";
import { runRuntimeGates, type RuntimeGateInput } from "../../application/runtime/run-runtime-gates.js";
import { writeGovernanceGateReport } from "../../application/runtime/write-governance-gate-report.js";
import { createAuditReport } from "../../application/maintenance/audit-install.js";
import { appendEffectivenessSignal } from "../../infrastructure/observability/local-metrics-store.js";
import { DEFAULT_WORKSPACE_ROOT, PACKAGE_ROOT, VISIBLE_BRIDGE_SURFACES, exists } from "../../shared/index.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";

async function collectMarkdownFiles(workspaceRoot: string): Promise<string[]> {
  const queue = [workspaceRoot];
  const files: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === ".git" || entry.name === "node_modules" || entry.name === "dist") {
        continue;
      }
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

export function registerAuditCommands(program: Command): void {
  const audit = program.command("audit").description("Audit runtime state and managed surfaces.");

  audit
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--profile <profile>", "output profile: brief|standard|deep", "standard")
    .option("--delta-only", "show only changed findings", false)
    .option("--summary-only", "emit verdict and counts only", false)
    .option("--max-findings <n>", "limit reported findings", parseInt)
    .option("--json", "json output", false)
    .action(async (options) => {
      const workspaceRoot = path.resolve(options.root);
      const result = await createAuditReport(workspaceRoot, PACKAGE_ROOT);
      await appendEffectivenessSignal(workspaceRoot, {
        signalType: "audit-run",
        subjectId: "audit",
        result: result.missingManagedPaths.length === 0 ? "success" : "failed",
        recordedAt: new Date().toISOString(),
        details: {
          missingManagedPaths: result.missingManagedPaths.length,
          missingBundles: result.missingBundles.length
        }
      });

      const maxFindings = options.maxFindings ?? (options.profile === "brief" ? 3 : options.profile === "deep" ? 15 : 7);

      if (options.json) {
        console.log(toJson({
          ...result,
          profile: options.profile,
          deltaOnly: options.deltaOnly,
          summaryOnly: options.summaryOnly,
          missingManagedPaths: result.missingManagedPaths.slice(0, maxFindings),
          missingBundles: result.missingBundles.slice(0, maxFindings)
        }));
        return;
      }

      console.log(`Workspace: ${workspaceRoot}`);
      console.log(`Profile: ${options.profile}`);
      console.log(`Package version: ${result.packageVersion}`);
      console.log(`Installed targets: ${result.installedTargets.join(", ") || "none"}`);
      console.log(`Installed bundles: ${result.installedBundles.length}`);
      console.log(`Missing managed paths: ${result.missingManagedPaths.length}`);
      console.log(`Package surface gaps: ${result.packageSurfaceMissingPaths.length}`);
      console.log(`Stale task artifacts: ${result.staleTaskArtifacts.length}`);
    });

  audit
    .command("duplicates")
    .description("Estimate duplicate markdown surfaces by concept-like path matching.")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (options) => {
      const workspaceRoot = path.resolve(options.root);
      if (!(await exists(workspaceRoot))) {
        throw new Error(`Workspace root not found: ${workspaceRoot}`);
      }

      const markdownFiles = await collectMarkdownFiles(workspaceRoot);
      const candidates = [] as Array<{ conceptId: string; canonicalPath: string; duplicatePath: string; canonicalContent: string; duplicateContent: string }>;
      const byName = new Map<string, string[]>();
      for (const file of markdownFiles) {
        const name = path.basename(file).toLowerCase();
        const list = byName.get(name) ?? [];
        list.push(file);
        byName.set(name, list);
      }

      for (const [name, files] of byName.entries()) {
        if (files.length < 2) {
          continue;
        }
        const canonical = files[0];
        if (!canonical) {
          continue;
        }
        const canonicalContent = await fs.readFile(canonical, "utf8");
        for (const duplicate of files.slice(1)) {
          if (!duplicate) {
            continue;
          }
          const duplicateContent = await fs.readFile(duplicate, "utf8");
          candidates.push({
            conceptId: `file.${name}`,
            canonicalPath: path.relative(workspaceRoot, canonical).replaceAll("\\", "/"),
            duplicatePath: path.relative(workspaceRoot, duplicate).replaceAll("\\", "/"),
            canonicalContent,
            duplicateContent
          });
        }
      }

      const inventory = detectDuplicateInventory(candidates);
      console.log(options.json ? toJson(inventory) : JSON.stringify(inventory, null, 2));
    });

  audit
    .command("token")
    .description("Estimate hot-path token cost for first-hop orientation surfaces.")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--budget <n>", "max first-hop token budget", parseInt, 8000)
    .option("--json", "json output", false)
    .action(async (options, cmd) => {
      const json = options.json || cmd.optsWithGlobals().json;
      const workspaceRoot = path.resolve(options.root);
      const bridgePaths = VISIBLE_BRIDGE_SURFACES.filter((surface) => !surface.includes("/"));
      const analyses = [];
      let totalTokens = 0;

      for (const surface of bridgePaths) {
        const fullPath = path.join(workspaceRoot, surface);
        if (await exists(fullPath)) {
          try {
            const stat = await fs.stat(fullPath);
            if (!stat.isFile()) {
              continue;
            }
            const content = await fs.readFile(fullPath, "utf8");
            const analysis = analyzeBridgeSurface(surface, content, options.budget);
            analyses.push(analysis);
            totalTokens += analysis.tokenEstimate;
          } catch {
            // skip unreadable entries
          }
        }
      }

      const hotRuntimePaths = [
        ".hforge/agent-manifest.json",
        ".hforge/runtime/index.json",
        ".hforge/runtime/authority-map.json",
        ".hforge/runtime/context-budget.json"
      ];

      for (const surface of hotRuntimePaths) {
        const fullPath = path.join(workspaceRoot, surface);
        if (await exists(fullPath)) {
          const content = await fs.readFile(fullPath, "utf8");
          const analysis = analyzeBridgeSurface(surface, content, options.budget);
          analyses.push(analysis);
          totalTokens += analysis.tokenEstimate;
        }
      }

      const withinBudget = totalTokens <= options.budget;

      const result = {
        workspaceRoot,
        budget: options.budget,
        totalEstimatedTokens: totalTokens,
        withinBudget,
        surfaces: analyses
      };

      if (json) {
        console.log(toJson(result));
        return;
      }

      console.log(`Hot-path token audit: ${workspaceRoot}`);
      console.log(`Budget: ${options.budget} tokens`);
      console.log(`Estimated total: ${totalTokens} tokens`);
      console.log(`Within budget: ${withinBudget ? "yes" : "NO — over budget"}`);
      for (const entry of analyses) {
        console.log(`  ${entry.path}: ${entry.tokenEstimate} tokens${entry.withinBudget ? "" : " (over)"}`);
      }
    });

  audit
    .command("governance")
    .description("Run all runtime governance gates and emit a gate report.")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (options, cmd) => {
      const json = options.json || cmd.optsWithGlobals().json;
      const workspaceRoot = path.resolve(options.root);

      // Hot-path budget check
      const agentsMdPath = path.join(workspaceRoot, "AGENTS.md");
      let hotPathTokens = 0;
      if (await exists(agentsMdPath)) {
        const content = await fs.readFile(agentsMdPath, "utf8");
        hotPathTokens += Math.round(content.split(/\s+/).filter(Boolean).length * 1.33);
      }
      const hotPathWithinBudget = hotPathTokens <= 8000;

      // Canonicality: check authority-map exists
      const authorityMapPath = path.join(workspaceRoot, ".hforge", "runtime", "authority-map.json");
      const canonicalityComplete = await exists(authorityMapPath);

      // Duplicate threshold: check for duplicate inventory
      const markdownFiles = await collectMarkdownFiles(workspaceRoot);
      const byName = new Map<string, string[]>();
      for (const file of markdownFiles) {
        const name = path.basename(file).toLowerCase();
        const list = byName.get(name) ?? [];
        list.push(file);
        byName.set(name, list);
      }
      const duplicateGroupCount = [...byName.values()].filter((group) => group.length > 1).length;
      const duplicateThresholdPass = duplicateGroupCount <= 20;

      // Bridge size check
      let bridgeBudgetPass = true;
      for (const surface of VISIBLE_BRIDGE_SURFACES) {
        const fullPath = path.join(workspaceRoot, surface);
        if (await exists(fullPath)) {
          try {
            const stat = await fs.stat(fullPath);
            if (stat.isFile()) {
              const content = await fs.readFile(fullPath, "utf8");
              const estimate = Math.round(content.split(/\s+/).filter(Boolean).length * 1.33);
              if (estimate > 4000) {
                bridgeBudgetPass = false;
              }
            }
          } catch {
            // skip directories
          }
        }
      }

      // Cold leakage: coverage/tests should not be in hot runtime
      const coldPaths = ["coverage", ".tmp"];
      let leakagePass = true;
      for (const cold of coldPaths) {
        const runtimeColdPath = path.join(workspaceRoot, ".hforge", "runtime", cold);
        if (await exists(runtimeColdPath)) {
          leakagePass = false;
        }
      }

      // Output profile coverage: check output-policy exists
      const outputPolicyPath = path.join(workspaceRoot, ".hforge", "runtime", "output-policy.json");
      const outputCoveragePass = await exists(outputPolicyPath);

      // Target honesty: check at least one adapter exists
      const targetHonestyPass = await exists(path.join(workspaceRoot, ".hforge", "agent-manifest.json"));

      const input: RuntimeGateInput = {
        hotPathWithinBudget,
        canonicalityComplete,
        duplicateThresholdPass,
        bridgeBudgetPass,
        leakagePass,
        outputCoveragePass,
        targetHonestyPass
      };

      const gateResults = runRuntimeGates(input);
      const reportPath = await writeGovernanceGateReport(workspaceRoot, gateResults);
      const allPass = gateResults.every((gate) => gate.status === "pass");

      const result = {
        workspaceRoot,
        allPass,
        gateResults,
        reportPath,
        metrics: {
          hotPathTokens,
          duplicateGroupCount,
          bridgeBudgetPass,
          leakagePass,
          outputCoveragePass,
          targetHonestyPass
        }
      };

      if (json) {
        console.log(toJson(result));
        return;
      }

      console.log(`Governance gate report: ${workspaceRoot}`);
      console.log(`Overall: ${allPass ? "PASS" : "FAIL"}`);
      for (const gate of gateResults) {
        console.log(`  ${gate.gateId}: ${gate.status} (${gate.severity})`);
      }
      console.log(`Report: ${reportPath}`);
    });
}


