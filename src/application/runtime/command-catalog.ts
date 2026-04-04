import path from "node:path";

import { GENERATED_DIR, readJsonFile, writeJsonFile, writeTextFile } from "../../shared/index.js";
import { resolveCommandPhase, PHASE_ORDER, PHASE_LABELS, type CommandPhaseId } from "./command-phase-mapping.js";

export interface AgentCommandCatalog {
  generatedAt: string;
  packageName: string;
  packageVersion: string;
  markdownCommands: Array<{
    id: string;
    trigger: string;
    docPath: string;
    description: string;
    relatedCliCommandIds: string[];
  }>;
  executionModes: Array<{
    id: string;
    platform: "any" | "windows" | "posix";
    commandPrefix: string;
    whenToUse: string;
  }>;
  preferredExecutionOrder: string[];
  cliCommands: Array<{
    id: string;
    command: string;
    description: string;
    phase?: "setup" | "operate" | "maintain" | "advanced";
    primaryInPhase?: boolean;
  }>;
  agentSafeCliCommands: Array<{
    id: string;
    description: string;
    variants: Array<{
      modeId: string;
      command: string;
    }>;
  }>;
  npmScripts: Record<string, string>;
  recommendedAgentCommands: string[];
  recursiveEscalationHeuristics?: {
    advisoryOnly: boolean;
    triggers: string[];
    preferredSequence: string[];
    operatorHintCommand: string;
  };
}

interface CatalogCommandEntry {
  id: string;
  command: string;
  description: string;
  phase?: "setup" | "operate" | "maintain" | "advanced";
  primaryInPhase?: boolean;
}

interface MarkdownCommandEntry {
  id: string;
  trigger: string;
  docPath: string;
  description: string;
  relatedCliCommandIds: string[];
}

function buildExecutionModes() {
  return [
    {
      id: "workspace-launcher-windows",
      platform: "windows" as const,
      commandPrefix: ".\\.hforge\\generated\\bin\\hforge.cmd",
      whenToUse: "Preferred in installed Windows workspaces when bare hforge is unavailable on PATH."
    },
    {
      id: "workspace-launcher-powershell",
      platform: "windows" as const,
      commandPrefix: ".\\.hforge\\generated\\bin\\hforge.ps1",
      whenToUse: "Use in PowerShell when the CMD launcher is not the preferred shell entrypoint."
    },
    {
      id: "workspace-launcher-posix",
      platform: "posix" as const,
      commandPrefix: "./.hforge/generated/bin/hforge",
      whenToUse: "Preferred in installed POSIX workspaces when bare hforge is unavailable on PATH."
    },
    {
      id: "bare-hforge",
      platform: "any" as const,
      commandPrefix: "hforge",
      whenToUse: "Use when hforge is already available on PATH through shell setup or global install."
    },
    {
      id: "npx-package",
      platform: "any" as const,
      commandPrefix: "npx @harness-forge/cli",
      whenToUse: "Fallback when no local launcher is available yet or when the agent is working before install."
    }
  ];
}

function buildCliCommands(): CatalogCommandEntry[] {
  return [
    {
      id: "interactive-front-door",
      command: "hforge",
      description: "Launch the interactive onboarding flow for new workspaces or the project hub for an existing .hforge runtime."
    },
    { id: "init-basic", command: "hforge init --root <repo> --json", description: "Initialize the hidden Harness Forge runtime and install-state surfaces for a workspace." },
    {
      id: "init-direct",
      command: "hforge init --root <repo> --agent codex --setup-profile recommended --yes",
      description: "Initialize a workspace directly without prompts and install one or more selected agent targets."
    },
    { id: "bootstrap", command: "hforge bootstrap --root <repo> --yes", description: "Autodetect supported agent runtimes in a repo and install the recommended Harness Forge surfaces." },
    { id: "install", command: "hforge install --target <target> --root <repo> --yes", description: "Install for one explicit target with selected bundles, languages, frameworks, or capabilities." },
    { id: "status", command: "hforge status --root <repo> --json", description: "Inspect the current install state." },
    { id: "refresh", command: "hforge refresh --root <repo> --json", description: "Refresh the shared runtime summary and baseline artifacts for the installed targets." },
    {
      id: "update",
      command: "hforge update --root <repo> --yes",
      description: "Download the latest Harness Forge package and reapply managed surfaces without discarding preserved runtime state."
    },
    {
      id: "upgrade",
      command: "hforge upgrade --root <repo> --yes",
      description: "Alias for the non-destructive update flow that refreshes managed surfaces from the latest package."
    },
    { id: "task-list", command: "hforge task list --root <repo> --json", description: "List task-runtime folders and the artifacts currently available for each task." },
    { id: "task-inspect", command: "hforge task inspect <taskId> --root <repo> --json", description: "Inspect file-interest, impact-analysis, task-pack, and recursive linkage for one task." },
    { id: "pack-list", command: "hforge pack list --root <repo> --json", description: "List available and installed runtime packs plus footprint summaries." },
    { id: "pack-inspect", command: "hforge pack inspect <packId> --root <repo> --json", description: "Inspect one runtime pack manifest or task pack artifact." },
    { id: "pack-explain", command: "hforge pack explain <packId> --root <repo> --json", description: "Explain one runtime pack's dependencies, managed roots, and sample managed-surface provenance." },
    { id: "pack-add", command: "hforge pack add <packId> --root <repo> --json", description: "Add one or more runtime packs to the current workspace install plan." },
    { id: "pack-remove", command: "hforge pack remove <packId> --root <repo> --json", description: "Remove one or more runtime packs from workspace install state." },
    { id: "pack-sync", command: "hforge pack sync --root <repo> --json", description: "Report pack-state synchronization posture for the current workspace." },
    { id: "profile-list", command: "hforge profile list --root <repo> --json", description: "List available runtime profiles." },
    { id: "profile-inspect", command: "hforge profile inspect <profileId> --json", description: "Inspect one runtime profile manifest." },
    { id: "review", command: "hforge review --root <repo> --json", description: "Summarize runtime health, decision coverage, and stale task artifacts." },
    { id: "export", command: "hforge export --root <repo> --json", description: "Export install-state, runtime index, doctor, and audit summaries for review or handoff." },
    { id: "shell-setup", command: "hforge shell setup --yes", description: "Create user-level shims and update supported shell profiles so bare hforge is available on PATH." },
    { id: "shell-status", command: "hforge shell status --json", description: "Inspect shell integration status, shim presence, profile wiring, and bare hforge availability." },
    { id: "commands", command: "hforge commands --json", description: "List CLI commands and npm scripts that agents can use safely." },
    { id: "recommend", command: "hforge recommend <repo> --json", description: "Inspect a repository and return evidence-backed recommendations." },
    { id: "scan", command: "hforge scan <repo> --json", description: "Collect a human- or machine-readable baseline scan of a repository." },
    { id: "cartograph", command: "hforge cartograph <repo> --json", description: "Build a repo map showing services, hotspots, ownership, and validation gaps." },
    { id: "classify-boundaries", command: "hforge classify-boundaries <repo> --json", description: "Classify service and package boundaries for a repository." },
    { id: "synthesize-instructions", command: "hforge synthesize-instructions <repo> --target codex --json", description: "Generate target-aware AGENTS and instruction-plan recommendations for a repository." },
    { id: "target-inspect", command: "hforge target inspect <target> --json", description: "Inspect support, mappings, and capability notes for Codex, Claude Code, Cursor, or OpenCode." },
    { id: "capabilities", command: "hforge capabilities --target codex --json", description: "Inspect the support matrix for one target or all targets." },
    { id: "flow-status", command: "hforge flow status --root <repo> --json", description: "Inspect recoverable flow state." },
    {
      id: "recursive-plan",
      command: 'hforge recursive plan "investigate cross-module issue" --task-id TASK-001 --root <repo> --json',
      description: "Create a durable draft recursive session for difficult work without disturbing ordinary task flows."
    },
    {
      id: "recursive-capabilities",
      command: "hforge recursive capabilities --root <repo> --json",
      description: "Inspect the canonical recursive structured-analysis capability map for the current workspace."
    },
    {
      id: "recursive-runtimes",
      command: "hforge recursive runtimes --root <repo> --json",
      description: "Inspect host and workspace-managed runtimes available for recursive code cells."
    },
    {
      id: "recursive-provision-runtime",
      command: "hforge recursive provision-runtime <python|powershell> --root <repo> --json",
      description: "Register a workspace-managed recursive runtime alias when a healthy host runtime is available."
    },
    {
      id: "recursive-run-file",
      command: "hforge recursive run <sessionId> --file <snippet.mjs> --root <repo> --json",
      description: "Submit one session-scoped structured analysis snippet from a file into a recursive session."
    },
    {
      id: "recursive-run-stdin",
      command: "hforge recursive run <sessionId> --stdin --root <repo> --json",
      description: "Submit one session-scoped structured analysis snippet from standard input into a recursive session."
    },
    {
      id: "recursive-runs",
      command: "hforge recursive runs <sessionId> --root <repo> --json",
      description: "List durable structured-analysis run records for one recursive session."
    },
    {
      id: "recursive-inspect-run",
      command: "hforge recursive inspect-run <sessionId> <runId> --root <repo> --json",
      description: "Inspect one recorded structured-analysis run within a recursive session."
    },
    {
      id: "recursive-inspect",
      command: "hforge recursive inspect <sessionId> --root <repo> --json",
      description: "Inspect recursive session identity, budget, handles, and current promotion state."
    },
    { id: "observability-summarize", command: "hforge observability summarize --root <repo> --json", description: "Summarize local observability events and effectiveness signals." },
    { id: "observability-report", command: "hforge observability report <repo> --json", description: "Report local recommendation and maintenance effectiveness signals." },
    { id: "parallel-plan", command: "hforge parallel plan <tasks.md> --root <repo> --json", description: "Create a parallel worktree shard plan from a task backlog." },
    { id: "parallel-status", command: "hforge parallel status --root <repo> --json", description: "Inspect the current parallel execution plan status." },
    { id: "parallel-merge-check", command: "hforge parallel merge-check --root <repo> --json", description: "Check whether the current shard plan is merge-ready." },
    { id: "doctor", command: "hforge doctor --root <repo> --json", description: "Check installation health and missing managed surfaces." },
    { id: "audit", command: "hforge audit --root <repo> --json", description: "Audit install state and package surface integrity." },
    { id: "diff-install", command: "hforge diff-install --root <repo> --json", description: "Compare managed install expectations against the repo." },
    { id: "template-validate", command: "hforge template validate --json", description: "Validate the shipped task and workflow templates." },
    { id: "runtime-orientation", command: "hforge runtime orientation --root <repo> --json", description: "Inspect first-hop orientation surfaces and budget posture." },
    { id: "runtime-tiers", command: "hforge runtime tiers --json", description: "Inspect hot, warm, and cold surface-tier metadata." },
    { id: "audit-duplicates", command: "hforge audit duplicates --root <repo> --json", description: "Estimate duplicate retrieval fanout and repeated token exposure." },
    { id: "target-compliance", command: "hforge target compliance --json", description: "Validate target adapter support posture and bridge compliance." }
  ];
}

function buildMarkdownCommands(): MarkdownCommandEntry[] {
  return [
    {
      id: "hforge-init",
      trigger: "/hforge-init",
      docPath: "commands/hforge-init.md",
      description: "Bootstrap or initialize Harness Forge in the current repository before deeper work.",
      relatedCliCommandIds: ["init-basic", "bootstrap", "refresh"]
    },
    {
      id: "hforge-analyze",
      trigger: "/hforge-analyze",
      docPath: "commands/hforge-analyze.md",
      description: "Inspect the installed runtime, repo intelligence, and next actions before coding.",
      relatedCliCommandIds: ["status", "commands", "recommend", "review"]
    },
    {
      id: "hforge-review",
      trigger: "/hforge-review",
      docPath: "commands/hforge-review.md",
      description: "Review runtime health, drift, stale task artifacts, and decision coverage.",
      relatedCliCommandIds: ["review", "doctor", "audit"]
    },
    {
      id: "hforge-refresh",
      trigger: "/hforge-refresh",
      docPath: "commands/hforge-refresh.md",
      description: "Regenerate runtime summaries and helper outputs after install or repo changes.",
      relatedCliCommandIds: ["refresh", "status"]
    },
    {
      id: "hforge-decide",
      trigger: "/hforge-decide",
      docPath: "commands/hforge-decide.md",
      description: "Capture an architecture-significant choice as a durable ASR or ADR.",
      relatedCliCommandIds: ["task-inspect", "review"]
    },
    {
      id: "hforge-status",
      trigger: "/hforge-status",
      docPath: "commands/hforge-status.md",
      description: "Inspect current workspace state and the most relevant runtime surfaces.",
      relatedCliCommandIds: ["status", "commands"]
    },
    {
      id: "hforge-commands",
      trigger: "/hforge-commands",
      docPath: "commands/hforge-commands.md",
      description: "Inspect the shipped command catalog before inventing execution paths.",
      relatedCliCommandIds: ["commands", "shell-status"]
    },
    {
      id: "hforge-recommend",
      trigger: "/hforge-recommend",
      docPath: "commands/hforge-recommend.md",
      description: "Run repo-intelligence and recommendation flows before setup or architecture work.",
      relatedCliCommandIds: ["recommend", "cartograph", "classify-boundaries", "synthesize-instructions"]
    },
    {
      id: "hforge-cartograph",
      trigger: "/hforge-cartograph",
      docPath: "commands/hforge-cartograph.md",
      description: "Build and inspect repo maps, service boundaries, hotspots, and validation gaps.",
      relatedCliCommandIds: ["cartograph", "classify-boundaries", "recommend"]
    },
    {
      id: "hforge-task",
      trigger: "/hforge-task",
      docPath: "commands/hforge-task.md",
      description: "Inspect task-runtime folders, packs, and linked task artifacts.",
      relatedCliCommandIds: ["task-list", "task-inspect", "pack-inspect"]
    },
    {
      id: "hforge-recursive",
      trigger: "/hforge-recursive",
      docPath: "commands/hforge-recursive.md",
      description: "Escalate difficult work into recursive structured-analysis with durable session and run artifacts.",
      relatedCliCommandIds: [
        "recursive-plan",
        "recursive-capabilities",
        "recursive-runtimes",
        "recursive-run-file",
        "recursive-run-stdin",
        "recursive-runs",
        "recursive-inspect-run",
        "recursive-inspect"
      ]
    },
    {
      id: "hforge-recursive-investigate",
      trigger: "/hforge-recursive-investigate",
      docPath: "commands/hforge-recursive-investigate.md",
      description: "Autonomously escalate hard tasks into a recursive investigation, preferring Typed RLM before bounded structured-analysis fallback.",
      relatedCliCommandIds: [
        "recursive-plan",
        "recursive-capabilities",
        "recursive-runtimes",
        "recursive-provision-runtime",
        "recursive-inspect",
        "recursive-run-file",
        "recursive-run-stdin",
        "recursive-runs",
        "recursive-inspect-run"
      ]
    },
    {
      id: "hforge-update",
      trigger: "/hforge-update",
      docPath: "commands/hforge-update.md",
      description: "Preview or apply a non-destructive Harness Forge package refresh.",
      relatedCliCommandIds: ["update", "upgrade", "review", "export"]
    }
  ];
}

function buildAgentSafeCliCommands(commands: CatalogCommandEntry[]) {
  const executionModes = buildExecutionModes();
  return commands.map((entry) => {
    const suffix = entry.command === "hforge" ? "" : entry.command.slice("hforge".length);
    return {
      id: entry.id,
      description: entry.description,
      variants: executionModes.map((mode) => ({
        modeId: mode.id,
        command: `${mode.commandPrefix}${suffix}`
      }))
    };
  });
}

export async function loadAgentCommandCatalog(packageRoot: string): Promise<AgentCommandCatalog> {
  const packageJson = await readJsonFile<{
    name: string;
    version: string;
    scripts?: Record<string, string>;
  }>(path.join(packageRoot, "package.json"));

  const rawCliCommands = buildCliCommands();
  const cliCommands = rawCliCommands.map((entry) => {
    const mapping = resolveCommandPhase(entry.id);
    return { ...entry, phase: mapping.phase, primaryInPhase: mapping.primaryInPhase };
  });
  const markdownCommands = buildMarkdownCommands();
  const executionModes = buildExecutionModes();

  return {
    generatedAt: new Date().toISOString(),
    packageName: packageJson.name,
    packageVersion: packageJson.version,
    markdownCommands,
    executionModes,
    preferredExecutionOrder: ["workspace-launcher-windows", "workspace-launcher-powershell", "workspace-launcher-posix", "bare-hforge", "npx-package"],
    cliCommands,
    agentSafeCliCommands: buildAgentSafeCliCommands(cliCommands),
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
      "npm run observability:report",
      "/hforge-recursive-investigate"
    ],
    recursiveEscalationHeuristics: {
      advisoryOnly: true,
      triggers: [
        "cross-module investigation",
        "ambiguous root cause",
        "long-context pressure",
        "policy-sensitive bounded execution",
        "artifact-worthy investigation"
      ],
      preferredSequence: [
        "inspect installed runtime surfaces",
        "check recursive capabilities and runtimes",
        "plan a session",
        "prefer Typed RLM",
        "inspect artifacts",
        "summarize from durable evidence"
      ],
      operatorHintCommand: "/hforge-recursive-investigate"
    }
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
    "## Agent execution order",
    ...catalog.preferredExecutionOrder.map((modeId) => {
      const mode = catalog.executionModes.find((entry) => entry.id === modeId)!;
      return `- \`${mode.commandPrefix}\` - ${mode.whenToUse}`;
    }),
    "",
    "## Markdown command entrypoints",
    ...catalog.markdownCommands.map((entry) =>
      `- \`${entry.trigger}\` -> \`${entry.docPath}\` - ${entry.description}`
    ),
    "",
    "## CLI commands",
    ...PHASE_ORDER.flatMap((phase) => {
      const phaseCommands = catalog.cliCommands.filter((entry) => entry.phase === phase);
      if (phaseCommands.length === 0) return [];
      return [
        "",
        `### ${PHASE_LABELS[phase]}`,
        ...phaseCommands.map((entry) =>
          `- \`${entry.command}\` - ${entry.description}${entry.primaryInPhase ? " *(primary)*" : ""}`
        )
      ];
    }),
    "",
    "## Agent-safe command variants",
    ...catalog.agentSafeCliCommands.flatMap((entry) => [
      `- \`${entry.id}\` - ${entry.description}`,
      ...entry.variants.map((variant) => `  - [${variant.modeId}] \`${variant.command}\``)
    ]),
    "",
    "## Recursive escalation heuristics",
    `- advisory only: \`${catalog.recursiveEscalationHeuristics?.advisoryOnly ?? true}\``,
    ...((catalog.recursiveEscalationHeuristics?.triggers ?? []).map((entry) => `- trigger: ${entry}`)),
    ...((catalog.recursiveEscalationHeuristics?.preferredSequence ?? []).map((entry) => `- sequence: ${entry}`)),
    ...(catalog.recursiveEscalationHeuristics?.operatorHintCommand
      ? [`- operator hint: \`${catalog.recursiveEscalationHeuristics.operatorHintCommand}\``]
      : []),
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


