import { Command } from "commander";
import fs from "node:fs/promises";
import path from "node:path";

import { recommendTemplates } from "../../application/recommendations/recommend-templates.js";
import { listTemplateCatalog, validateTemplateCatalog, validateWorkflowTemplate, workflowGraph } from "../../application/validation/validate-templates.js";
import { REPO_ROOT } from "../../shared/index.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";

export function registerTemplateCommands(program: Command): void {
  const template = program.command("template");

  template
    .command("list")
    .option("--root <root>", "workspace root", REPO_ROOT)
    .option("--json", "json output", false)
    .action(async (options) => {
      const entries = await listTemplateCatalog(options.root);
      console.log(options.json ? toJson(entries) : entries.map((entry) => `${entry.id} (${entry.kind})`).join("\n"));
    });

  template
    .command("show")
    .argument("<id>")
    .option("--root <root>", "workspace root", REPO_ROOT)
    .action(async (id, options) => {
      const entry = (await listTemplateCatalog(options.root)).find((item) => item.id === id);
      if (entry) {
        console.log(await fs.readFile(path.join(options.root, entry.file), "utf8"));
        return;
      }
      throw new Error(`Unknown template ${id}`);
    });

  template
    .command("validate")
    .option("--root <root>", "workspace root", REPO_ROOT)
    .option("--json", "json output", false)
    .action(async (options) => {
      const report = await validateTemplateCatalog(options.root);
      console.log(options.json ? toJson(report) : JSON.stringify(report, null, 2));
      if (!report.ok) process.exitCode = 1;
    });

  const workflow = program.command("workflow");

  workflow
    .command("show")
    .argument("<id>")
    .option("--root <root>", "workspace root", REPO_ROOT)
    .action(async (id, options) => {
      const entry = (await listTemplateCatalog(options.root)).find((item) => item.id === id && item.kind === "workflow-template");
      if (!entry) {
        throw new Error(`Unknown workflow ${id}`);
      }
      console.log(await fs.readFile(path.join(options.root, entry.file), "utf8"));
    });

  workflow
    .command("validate")
    .argument("<id>")
    .option("--root <root>", "workspace root", REPO_ROOT)
    .action(async (id, options) => {
      const report = await validateWorkflowTemplate(options.root, id);
      console.log(JSON.stringify(report, null, 2));
      if (!report.ok) process.exitCode = 1;
    });

  workflow
    .command("graph")
    .argument("<id>")
    .option("--root <root>", "workspace root", REPO_ROOT)
    .action(async (id, options) => {
      console.log(await workflowGraph(options.root, id));
    });

  program
    .command("recommend")
    .argument("<intent>")
    .action((intent) => {
      console.log(JSON.stringify(recommendTemplates(intent), null, 2));
    });
}
