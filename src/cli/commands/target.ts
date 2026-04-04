import { Command } from "commander";

import { validateTargetAdapters } from "../../application/install/validate-target-adapters.js";
import { compareTargets } from "../../application/targets/compare-targets.js";
import { verifyTargetSupportMode } from "../../application/runtime/verify-target-support-mode.js";
import { loadHarnessCapabilityMatrix, loadTargetManifests, type TargetManifest } from "../../domain/manifests/index.js";
import { loadTargetAdapter, loadTargetAdapters } from "../../domain/targets/adapter.js";
import { presentTargetComparison } from "../../infrastructure/presentation/presenters/target-comparison-presenter.js";
import { serializeTargetComparison } from "../../infrastructure/presentation/serializers/target-comparison-json.js";
import { PACKAGE_ROOT } from "../../shared/index.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";

function formatTargetSummary(target: TargetManifest, capabilityNotes: string[]): string {
  const lines = [
    `Target: ${target.displayName} (${target.id})`,
    `Support level: ${target.supportLevel ?? "unknown"}`,
    `Hooks: ${target.supportsHooks ? "yes" : "no"}`,
    `Commands: ${target.supportsCommands ? "yes" : "no"}`,
    `Agents: ${target.supportsAgents ? "yes" : "no"}`,
    `Contexts: ${target.supportsContexts ? "yes" : "no"}`,
    `Plugins: ${target.supportsPlugins ? "yes" : "no"}`,
    "",
    "Path mappings:"
  ];

  for (const [source, destination] of Object.entries(target.pathMappings)) {
    lines.push(`- ${source} -> ${destination}`);
  }

  lines.push("", "Support notes:");
  for (const note of capabilityNotes) {
    lines.push(`- ${note}`);
  }

  return lines.join("\n");
}

export function registerTargetCommands(program: Command): void {
  const target = program.command("target").description("Inspect target runtime support and packaged mappings.");

  target
    .command("list")
    .option("--json", "json output", false)
    .action(async (options) => {
      const targets = await loadTargetManifests(PACKAGE_ROOT);
      const result = targets.map((entry) => ({
        id: entry.id,
        displayName: entry.displayName,
        supportLevel: entry.supportLevel,
        supportsHooks: entry.supportsHooks,
        supportsCommands: entry.supportsCommands,
        supportsAgents: entry.supportsAgents
      }));

      console.log(options.json ? toJson(result) : JSON.stringify(result, null, 2));
    });

  target
    .command("inspect")
    .argument("<targetId>", "target runtime id such as codex, claude-code, cursor, or opencode")
    .option("--json", "json output", false)
    .action(async (targetId: string, options) => {
      const [adapter, capabilityMatrix] = await Promise.all([
        loadTargetAdapter(PACKAGE_ROOT, targetId),
        loadHarnessCapabilityMatrix(PACKAGE_ROOT)
      ]);
      const capabilityRecord = capabilityMatrix.targets.find((entry) => entry.targetId === targetId);
      const result = {
        target: adapter,
        capabilities: capabilityRecord?.capabilities ?? []
      };

      if (options.json) {
        console.log(toJson(result));
        return;
      }

      console.log(
        formatTargetSummary(
          adapter,
          [
            ...(adapter.supportNotes ?? []),
            ...((capabilityRecord?.capabilities ?? []).map(
              (capability) =>
                `${capability.capabilityId}: ${capability.supportLevel} (${capability.supportMode}) - ${capability.notes}`
            ))
          ]
        )
      );
    });

  target
    .command("compliance")
    .description("Validate target adapter support posture and bridge metadata.")
    .option("--json", "json output", false)
    .action(async (options) => {
      const adapters = await loadTargetAdapters(PACKAGE_ROOT);
      const structural = validateTargetAdapters(adapters);
      const modeChecks = adapters.map((adapter) =>
        verifyTargetSupportMode({
          targetId: adapter.id,
          declaredMode: (adapter.sharedRuntimeBridge?.supportMode === "documentation-only" || adapter.sharedRuntimeBridge?.supportMode === "unsupported"
            ? "partial"
            : adapter.sharedRuntimeBridge?.supportMode ?? "partial") as "native" | "bridged" | "translated" | "partial",
          observedSupportsHooks: adapter.supportsHooks,
          observedSupportsCommands: adapter.supportsCommands
        })
      );

      const result = {
        structural,
        modeChecks,
        pass: structural.every((entry) => entry.valid) && modeChecks.every((entry) => entry.consistent)
      };

      console.log(options.json ? toJson(result) : JSON.stringify(result, null, 2));
    });

  target
    .command("compare")
    .argument("<left>", "first target id to compare")
    .argument("<right>", "second target id to compare")
    .option("--json", "json output", false)
    .action(async (left: string, right: string, options) => {
      const comparison = await compareTargets({ leftTargetId: left, rightTargetId: right, workspaceRoot: PACKAGE_ROOT });

      if (options.json) {
        console.log(serializeTargetComparison(comparison));
        return;
      }

      console.log(presentTargetComparison(comparison));
    });

  program
    .command("capabilities")
    .option("--target <target>", "inspect one target instead of all targets")
    .option("--json", "json output", false)
    .action(async (options) => {
      const capabilityMatrix = await loadHarnessCapabilityMatrix(PACKAGE_ROOT);
      const result = options.target
        ? capabilityMatrix.targets.find((entry) => entry.targetId === options.target) ?? null
        : capabilityMatrix.targets;

      console.log(options.json ? toJson(result) : JSON.stringify(result, null, 2));
    });
}
