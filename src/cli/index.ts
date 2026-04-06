#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { Command } from "commander";

import { registerAuditCommands } from "./commands/audit.js";
import { registerCatalogCommands } from "./commands/catalog.js";
import { registerCompactCommands } from "./commands/compact.js";
import { registerCommandsCatalog } from "./commands/commands.js";
import { registerDiffInstallCommands } from "./commands/diff-install.js";
import { registerDoctorCommands } from "./commands/doctor.js";
import { registerExportCommands } from "./commands/export.js";
import { registerImportCommands } from "./commands/import-bundle.js";
import { registerFlowCommands } from "./commands/flow.js";
import { registerInitCommands } from "./commands/init.js";
import { registerIntelligenceCommands } from "./commands/intelligence.js";
import { registerInstallCommands } from "./commands/install.js";
import { registerNextCommands } from "./commands/next.js";
import { registerMaintenanceCommands } from "./commands/maintenance.js";
import { registerObservabilityCommands } from "./commands/observability.js";
import { registerParallelCommands } from "./commands/parallel.js";
import { registerPackCommands } from "./commands/pack.js";
import { registerProfileCommands } from "./commands/profile.js";
import { registerPruneCommands } from "./commands/prune.js";
import { registerRefreshCommands } from "./commands/refresh.js";
import { registerRuntimeCommands } from "./commands/runtime.js";
import { registerRecursiveCommands } from "./commands/recursive.js";
import { registerRecommendCommands } from "./commands/recommend.js";
import { registerReplayCommands } from "./commands/replay.js";
import { registerReviewCommands } from "./commands/review.js";
import { registerShellCommands } from "./commands/shell.js";
import { registerStatusCommands } from "./commands/status.js";
import { registerSyncCommands } from "./commands/sync.js";
import { registerTaskCommands } from "./commands/task.js";
import { registerTemplateCommands } from "./commands/template.js";
import { registerTargetCommands } from "./commands/target.js";
import { registerUpgradeSurfaceCommands } from "./commands/upgrade-surface.js";
import { formatCliError } from "../infrastructure/diagnostics/reporter.js";
import { PACKAGE_ROOT } from "../shared/index.js";
import { PHASE_LABELS, PHASE_ORDER, resolveCommandPhase, type CommandPhaseId } from "../application/runtime/command-phase-mapping.js";
import { runDefaultInteractiveEntry } from "./interactive/entry-router.js";

const program = new Command();
const packageJson = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, "package.json"), "utf8")) as {
  version: string;
  description?: string;
};

program
  .name("hforge")
  .description(packageJson.description ?? "Harness Forge agentic AI workspace installer and catalog runtime")
  .version(packageJson.version)
  .showHelpAfterError()
  .showSuggestionAfterError();

registerInitCommands(program);
registerInstallCommands(program);
registerStatusCommands(program);
registerRefreshCommands(program);
registerRuntimeCommands(program);
registerTaskCommands(program);
registerPackCommands(program);
registerProfileCommands(program);
registerReviewCommands(program);
registerShellCommands(program);
registerExportCommands(program);
registerImportCommands(program);
registerCommandsCatalog(program);
registerDoctorCommands(program);
registerAuditCommands(program);
registerFlowCommands(program);
registerCatalogCommands(program);
registerRecommendCommands(program);
registerIntelligenceCommands(program);
registerTemplateCommands(program);
registerTargetCommands(program);
registerMaintenanceCommands(program);
registerObservabilityCommands(program);
registerParallelCommands(program);
registerRecursiveCommands(program);
registerSyncCommands(program);
registerDiffInstallCommands(program);
registerUpgradeSurfaceCommands(program);
registerCompactCommands(program);
registerReplayCommands(program);
registerPruneCommands(program);
registerNextCommands(program);

// Custom help: group subcommands by lifecycle phase, hide advanced by default
program.addHelpText("after", () => {
  const subcommands = program.commands as Command[];
  if (subcommands.length === 0) {
    return "";
  }

  const grouped: Record<CommandPhaseId, Command[]> = {
    setup: [],
    operate: [],
    maintain: [],
    advanced: [],
  };

  for (const sub of subcommands) {
    const mapping = resolveCommandPhase(sub.name());
    grouped[mapping.phase].push(sub);
  }

  const padWidth = Math.max(...subcommands.map((s) => s.name().length)) + 2;
  const lines: string[] = ["", "Commands by phase:"];

  for (const phase of PHASE_ORDER) {
    if (phase === "advanced") continue;
    const phaseCommands = grouped[phase];
    if (phaseCommands.length === 0) continue;
    lines.push(`\n  ${PHASE_LABELS[phase]}:`);
    for (const sub of phaseCommands) {
      lines.push(`    ${sub.name().padEnd(padWidth)}${sub.description()}`);
    }
  }

  lines.push('\nRun "hforge commands --all" to see advanced commands.');
  return lines.join("\n");
});

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    const handled = await runDefaultInteractiveEntry(args, process.cwd());
    if (handled) {
      return;
    }
    program.outputHelp();
    console.error('No interactive terminal detected. Re-run with "hforge init --root <repo> --agent codex --yes" or add "--dry-run".');
    process.exitCode = 1;
    return;
  }

  await program.parseAsync(process.argv);
}

main().catch((error: unknown) => {
  console.error(formatCliError(error));
  process.exitCode = 1;
});
