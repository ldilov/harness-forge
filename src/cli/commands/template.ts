import { Command } from "commander";
import fs from "node:fs/promises";
import path from "node:path";

import { recommendTemplates } from "../../application/recommendations/recommend-templates.js";
import { listTemplateCatalog, validateTemplateCatalog, validateWorkflowTemplate, workflowGraph } from "../../application/validation/validate-templates.js";
import { PACKAGE_ROOT } from "../../shared/index.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";

export function registerTemplateCommands(program: Command): void {
  const template = program.command("template");

  template
    .command("list")
    .option("--root <root>", "package content root", PACKAGE_ROOT)
    .option("--json", "json output", false)
    .action(async (options) => {
      const contentRoot = path.resolve(options.root);
      const entries = await listTemplateCatalog(contentRoot);
      console.log(options.json ? toJson(entries) : entries.map((entry) => `${entry.id} (${entry.kind})`).join("\n"));
    });

  template
    .command("show")
    .argument("<id>")
    .option("--root <root>", "package content root", PACKAGE_ROOT)
    .action(async (id, options) => {
      const contentRoot = path.resolve(options.root);
      const entry = (await listTemplateCatalog(contentRoot)).find((item) => item.id === id);
      if (entry) {
        console.log(await fs.readFile(path.join(contentRoot, entry.file), "utf8"));
        return;
      }
      throw new Error(`Unknown template ${id}`);
    });

  template
    .command("validate")
    .option("--root <root>", "package content root", PACKAGE_ROOT)
    .option("--json", "json output", false)
    .action(async (options) => {
      const contentRoot = path.resolve(options.root);
      const report = await validateTemplateCatalog(contentRoot);
      console.log(options.json ? toJson(report) : JSON.stringify(report, null, 2));
      if (!report.ok) process.exitCode = 1;
    });

  const workflow = program.command("workflow");

  workflow
    .command("show")
    .argument("<id>")
    .option("--root <root>", "package content root", PACKAGE_ROOT)
    .action(async (id, options) => {
      const contentRoot = path.resolve(options.root);
      const entry = (await listTemplateCatalog(contentRoot)).find((item) => item.id === id && item.kind === "workflow-template");
      if (!entry) {
        throw new Error(`Unknown workflow ${id}`);
      }
      console.log(await fs.readFile(path.join(contentRoot, entry.file), "utf8"));
    });

  workflow
    .command("validate")
    .argument("<id>")
    .option("--root <root>", "package content root", PACKAGE_ROOT)
    .action(async (id, options) => {
      const contentRoot = path.resolve(options.root);
      const report = await validateWorkflowTemplate(contentRoot, id);
      console.log(JSON.stringify(report, null, 2));
      if (!report.ok) process.exitCode = 1;
    });

  workflow
    .command("graph")
    .argument("<id>")
    .option("--root <root>", "package content root", PACKAGE_ROOT)
    .action(async (id, options) => {
      const contentRoot = path.resolve(options.root);
      console.log(await workflowGraph(contentRoot, id));
    });

  program
    .command("recommend")
    .argument("<intent>")
    .action((intent) => {
      console.log(JSON.stringify(recommendTemplates(intent), null, 2));
    });
}
