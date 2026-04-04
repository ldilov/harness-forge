import path from "node:path";
import { Command } from "commander";

import { loadAgentCommandCatalog } from "../../application/runtime/command-catalog.js";
import { PHASE_ORDER, PHASE_LABELS, type CommandPhaseId } from "../../application/runtime/command-phase-mapping.js";
import { PACKAGE_ROOT } from "../../shared/index.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";

export function registerCommandsCatalog(program: Command): void {
  program
    .command("commands")
    .option("--root <root>", "package content root", PACKAGE_ROOT)
    .option("--json", "json output", false)
    .option("--grouped", "group commands by lifecycle phase", false)
    .option("--all", "show all commands including advanced", false)
    .action(async (options) => {
      const contentRoot = path.resolve(options.root);
      const catalog = await loadAgentCommandCatalog(contentRoot);

      const showAll = Boolean(options.all);
      const showGrouped = Boolean(options.grouped);

      const visiblePhases: readonly CommandPhaseId[] = showAll
        ? PHASE_ORDER
        : PHASE_ORDER.filter((p) => p !== "advanced");

      const visibleCommands = catalog.cliCommands.filter(
        (entry) => showAll || entry.phase !== "advanced"
      );

      if (options.json) {
        if (showGrouped) {
          const grouped: Record<string, typeof catalog.cliCommands> = {};
          for (const phase of visiblePhases) {
            grouped[phase] = visibleCommands.filter((entry) => entry.phase === phase);
          }
          console.log(toJson({ ...catalog, cliCommandsByPhase: grouped, cliCommands: visibleCommands }));
        } else {
          console.log(toJson({ ...catalog, cliCommands: visibleCommands }));
        }
        return;
      }

      const lines = [
        `Package: ${catalog.packageName}@${catalog.packageVersion}`,
        "",
        "Markdown commands:"
      ];

      for (const entry of catalog.markdownCommands) {
        lines.push(`- ${entry.trigger}: ${entry.description} (${entry.docPath})`);
      }

      if (showGrouped) {
        lines.push("", "CLI commands (grouped by lifecycle phase):");
        for (const phase of visiblePhases) {
          const phaseCommands = visibleCommands.filter((entry) => entry.phase === phase);
          if (phaseCommands.length === 0) continue;
          lines.push("", `  ${PHASE_LABELS[phase]}:`);
          for (const entry of phaseCommands) {
            const marker = entry.primaryInPhase ? " *" : "";
            lines.push(`    - ${entry.command}: ${entry.description}${marker}`);
          }
        }
        if (!showAll) {
          lines.push("", '  (Use --all to show advanced commands)');
        }
      } else {
        lines.push("", "CLI commands:");
        for (const entry of visibleCommands) {
          lines.push(`- ${entry.command}: ${entry.description}`);
        }
        if (!showAll) {
          lines.push("", '(Use --all to show advanced commands)');
        }
      }

      lines.push("", "Recommended npm scripts:");
      for (const entry of catalog.recommendedAgentCommands) {
        lines.push(`- ${entry}`);
      }

      console.log(lines.join("\n"));
    });
}
