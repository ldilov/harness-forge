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
      {
        command: "hforge",
        description: "Launch the interactive onboarding flow for new workspaces or the project hub for an existing .hforge runtime."
      },
      { command: "hforge init --root <repo> --json", description: "Initialize the hidden Harness Forge runtime and install-state surfaces for a workspace." },
      {
        command: "hforge init --root <repo> --agent codex --setup-profile recommended --yes",
        description: "Initialize a workspace directly without prompts and install one or more selected agent targets."
      },
      { command: "hforge bootstrap --root <repo> --yes", description: "Autodetect supported agent runtimes in a repo and install the recommended Harness Forge surfaces." },
      { command: "hforge install --target <target> --root <repo> --yes", description: "Install for one explicit target with selected bundles, languages, frameworks, or capabilities." },
      { command: "hforge status --root <repo> --json", description: "Inspect the current install state." },
      { command: "hforge refresh --root <repo> --json", description: "Refresh the shared runtime summary and baseline artifacts for the installed targets." },
      { command: "hforge task list --root <repo> --json", description: "List task-runtime folders and the artifacts currently available for each task." },
      { command: "hforge task inspect <taskId> --root <repo> --json", description: "Inspect file-interest, impact-analysis, task-pack, and recursive linkage for one task." },
      { command: "hforge pack inspect <taskId> --root <repo> --json", description: "Inspect the canonical task-pack artifact for one task." },
      { command: "hforge review --root <repo> --json", description: "Summarize runtime health, decision coverage, and stale task artifacts." },
      { command: "hforge export --root <repo> --json", description: "Export install-state, runtime index, doctor, and audit summaries for review or handoff." },
      { command: "hforge commands --json", description: "List CLI commands and npm scripts that agents can use safely." },
      { command: "hforge recommend <repo> --json", description: "Inspect a repository and return evidence-backed recommendations." },
      { command: "hforge scan <repo> --json", description: "Collect a human- or machine-readable baseline scan of a repository." },
      { command: "hforge cartograph <repo> --json", description: "Build a repo map showing services, hotspots, ownership, and validation gaps." },
      { command: "hforge classify-boundaries <repo> --json", description: "Classify service and package boundaries for a repository." },
      { command: "hforge synthesize-instructions <repo> --target codex --json", description: "Generate target-aware AGENTS and instruction-plan recommendations for a repository." },
      { command: "hforge target inspect <target> --json", description: "Inspect support, mappings, and capability notes for Codex, Claude Code, Cursor, or OpenCode." },
      { command: "hforge capabilities --target codex --json", description: "Inspect the support matrix for one target or all targets." },
      { command: "hforge flow status --root <repo> --json", description: "Inspect recoverable flow state." },
      {
        command: 'hforge recursive plan "investigate cross-module issue" --task-id TASK-001 --root <repo> --json',
        description: "Create a durable draft recursive session for difficult work without disturbing ordinary task flows."
      },
      {
        command: "hforge recursive inspect <sessionId> --root <repo> --json",
        description: "Inspect recursive session identity, budget, handles, and current promotion state."
      },
      { command: "hforge observability summarize --root <repo> --json", description: "Summarize local observability events and effectiveness signals." },
      { command: "hforge observability report <repo> --json", description: "Report local recommendation and maintenance effectiveness signals." },
      { command: "hforge parallel plan <tasks.md> --root <repo> --json", description: "Create a parallel worktree shard plan from a task backlog." },
      { command: "hforge parallel status --root <repo> --json", description: "Inspect the current parallel execution plan status." },
      { command: "hforge parallel merge-check --root <repo> --json", description: "Check whether the current shard plan is merge-ready." },
      { command: "hforge doctor --root <repo> --json", description: "Check installation health and missing managed surfaces." },
      { command: "hforge audit --root <repo> --json", description: "Audit install state and package surface integrity." },
      { command: "hforge diff-install --root <repo> --json", description: "Compare managed install expectations against the repo." },
      { command: "hforge template validate --json", description: "Validate the shipped task and workflow templates." }
    ],
    npmScripts: packageJson.scripts ?? {},
    recommendedAgentCommands: [
      "npm run recommend:current",
      "npm run cartograph:current",
      "npm run instructions:codex",
      "npm run target:codex",
      "npm run target:claude-code",
      "npm run target:opencode",
      "npm run observability:summary",
      "npm run validate:local",
      "npm run smoke:cli",
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
