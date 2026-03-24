#!/usr/bin/env node
import { Command } from "commander";

import { registerCatalogCommands } from "./commands/catalog.js";
import { registerInstallCommands } from "./commands/install.js";
import { registerMaintenanceCommands } from "./commands/maintenance.js";
import { registerStatusCommands } from "./commands/status.js";
import { registerTemplateCommands } from "./commands/template.js";

const program = new Command();

program
  .name("hforge")
  .description("Harness Forge agentic AI workspace installer and catalog runtime")
  .version("0.1.0");

registerInstallCommands(program);
registerStatusCommands(program);
registerCatalogCommands(program);
registerTemplateCommands(program);
registerMaintenanceCommands(program);

for (const name of ["plan", "diff", "validate"]) {
  program.command(name).action(() => {
    console.log(`${name} is available through the current runtime scaffold.`);
  });
}

program.parseAsync(process.argv).catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
