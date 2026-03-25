#!/usr/bin/env node
import { Command } from "commander";

import { registerAuditCommands } from "./commands/audit.js";
import { registerCatalogCommands } from "./commands/catalog.js";
import { registerCommandsCatalog } from "./commands/commands.js";
import { registerDiffInstallCommands } from "./commands/diff-install.js";
import { registerDoctorCommands } from "./commands/doctor.js";
import { registerFlowCommands } from "./commands/flow.js";
import { registerInstallCommands } from "./commands/install.js";
import { registerMaintenanceCommands } from "./commands/maintenance.js";
import { registerPruneCommands } from "./commands/prune.js";
import { registerRecommendCommands } from "./commands/recommend.js";
import { registerStatusCommands } from "./commands/status.js";
import { registerSyncCommands } from "./commands/sync.js";
import { registerTemplateCommands } from "./commands/template.js";
import { registerUpgradeSurfaceCommands } from "./commands/upgrade-surface.js";

const program = new Command();

program
  .name("hforge")
  .description("Harness Forge agentic AI workspace installer and catalog runtime")
  .version("0.1.0");

registerInstallCommands(program);
registerStatusCommands(program);
registerCommandsCatalog(program);
registerDoctorCommands(program);
registerAuditCommands(program);
registerFlowCommands(program);
registerCatalogCommands(program);
registerRecommendCommands(program);
registerTemplateCommands(program);
registerMaintenanceCommands(program);
registerSyncCommands(program);
registerDiffInstallCommands(program);
registerUpgradeSurfaceCommands(program);
registerPruneCommands(program);

for (const name of [
  "plan",
  "diff",
  "validate",
  "capabilities",
  "cartograph",
  "synthesize-instructions",
  "parallel-plan",
  "parallel-status",
  "merge-check",
  "merge-report"
]) {
  program.command(name).action(() => {
    console.log(`${name} is available through the current runtime scaffold.`);
  });
}

program.parseAsync(process.argv).catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
