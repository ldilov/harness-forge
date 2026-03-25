import path from "node:path";

import { GENERATED_DIR, readJsonFile, writeJsonFile, writeTextFile } from "../../shared/index.js";

export interface AgentCommandCatalog {
  generatedAt: string;
  packageName: string;
  packageVersion: string;
  cliCommands: Array<{
    command: string;
    description: string;
  }>;
  npmScripts: Record<string, string>;
  recommendedAgentCommands: string[];
}

export async function loadAgentCommandCatalog(packageRoot: string): Promise<AgentCommandCatalog> {
  const packageJson = await readJsonFile<{
    name: string;
    version: string;
    scripts?: Record<string, string>;
  }>(path.join(packageRoot, "package.json"));

  return {
    generatedAt: new Date().toISOString(),
    packageName: packageJson.name,
    packageVersion: packageJson.version,
    cliCommands: [
      { command: "hforge init --root <repo> --json", description: "Initialize a workspace for Harness Forge state and target-aware setup." },
      { command: "hforge bootstrap --root <repo> --yes", description: "Autodetect supported agent runtimes in a repo and install the recommended Harness Forge surfaces." },
      { command: "hforge install --target <target> --root <repo> --yes", description: "Install for one explicit target with selected bundles, languages, frameworks, or capabilities." },
      { command: "hforge status --root <repo> --json", description: "Inspect the current install state." },
      { command: "hforge commands --json", description: "List CLI commands and npm scripts that agents can use safely." },
      { command: "hforge recommend <repo> --json", description: "Inspect a repository and return evidence-backed recommendations." },
      { command: "hforge flow status --root <repo> --json", description: "Inspect recoverable flow state." },
      { command: "hforge doctor --root <repo> --json", description: "Check installation health and missing managed surfaces." },
      { command: "hforge audit --root <repo> --json", description: "Audit install state and package surface integrity." },
      { command: "hforge diff-install --root <repo> --json", description: "Compare managed install expectations against the repo." },
      { command: "hforge template validate --json", description: "Validate the shipped task and workflow templates." }
    ],
    npmScripts: packageJson.scripts ?? {},
    recommendedAgentCommands: [
      "npm run validate:release",
      "npm run validate:compatibility",
      "npm run validate:doc-command-alignment",
      "npm run flow:status",
      "npm run observability:report"
    ]
  };
}

export async function writeAgentCommandCatalog(workspaceRoot: string, packageRoot: string): Promise<{
  jsonPath: string;
  markdownPath: string;
}> {
  const catalog = await loadAgentCommandCatalog(packageRoot);
  const jsonPath = path.join(workspaceRoot, GENERATED_DIR, "agent-command-catalog.json");
  const markdownPath = path.join(workspaceRoot, GENERATED_DIR, "agent-command-catalog.md");

  await writeJsonFile(jsonPath, catalog);
  const markdown = [
    "# Agent Command Catalog",
    "",
    `Generated: ${catalog.generatedAt}`,
    `Package: ${catalog.packageName}@${catalog.packageVersion}`,
    "",
    "## CLI commands",
    ...catalog.cliCommands.map((entry) => `- \`${entry.command}\` - ${entry.description}`),
    "",
    "## Recommended npm scripts",
    ...catalog.recommendedAgentCommands.map((entry) => `- \`${entry}\``),
    "",
    "## All npm scripts",
    ...Object.entries(catalog.npmScripts).map(([name, value]) => `- \`${name}\` -> \`${value}\``)
  ].join("\n");
  await writeTextFile(markdownPath, `${markdown}\n`);

  return { jsonPath, markdownPath };
}
