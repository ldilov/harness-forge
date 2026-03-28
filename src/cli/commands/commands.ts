import path from "node:path";
import { Command } from "commander";

import { loadAgentCommandCatalog } from "../../application/runtime/command-catalog.js";
import { PACKAGE_ROOT } from "../../shared/index.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";

export function registerCommandsCatalog(program: Command): void {
  program
    .command("commands")
    .option("--root <root>", "package content root", PACKAGE_ROOT)
    .option("--json", "json output", false)
    .action(async (options) => {
      const contentRoot = path.resolve(options.root);
      const catalog = await loadAgentCommandCatalog(contentRoot);

      if (options.json) {
        console.log(toJson(catalog));
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

      lines.push("", "CLI commands:");

      for (const entry of catalog.cliCommands) {
        lines.push(`- ${entry.command}: ${entry.description}`);
      }

      lines.push("", "Recommended npm scripts:");
      for (const entry of catalog.recommendedAgentCommands) {
        lines.push(`- ${entry}`);
      }

      console.log(lines.join("\n"));
    });
}
