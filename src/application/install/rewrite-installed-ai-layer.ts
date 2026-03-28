import fs from "node:fs/promises";
import path from "node:path";

import type { InstallPlan } from "../../domain/operations/install-plan.js";
import {
  AI_LAYER_LIBRARY_DIR,
  AI_LIBRARY_AGENTS_DIR,
  AI_LIBRARY_COMMANDS_DIR,
  AI_LIBRARY_CONTEXTS_DIR,
  AI_LIBRARY_DOCS_DIR,
  AI_LIBRARY_HOOKS_DIR,
  AI_LIBRARY_KNOWLEDGE_DIR,
  AI_LIBRARY_MANIFESTS_DIR,
  AI_LIBRARY_MCP_DIR,
  AI_LIBRARY_PROFILES_DIR,
  AI_LIBRARY_RULES_DIR,
  AI_LIBRARY_SCRIPTS_DIR,
  AI_LIBRARY_SCHEMAS_DIR,
  AI_LIBRARY_SKILLS_DIR,
  AI_LIBRARY_TARGETS_DIR,
  AI_TEMPLATES_DIR,
  exists
} from "../../shared/index.js";

const TEXT_FILE_EXTENSIONS = new Set([".json", ".md", ".mdc", ".toml", ".txt", ".yaml", ".yml"]);
const PATH_REPLACEMENTS = [
  { source: "templates/workflows", destination: `${AI_TEMPLATES_DIR}/workflows` },
  { source: "templates/tasks", destination: `${AI_TEMPLATES_DIR}/tasks` },
  { source: "knowledge-bases", destination: AI_LIBRARY_KNOWLEDGE_DIR },
  { source: "manifests", destination: AI_LIBRARY_MANIFESTS_DIR },
  { source: "schemas", destination: AI_LIBRARY_SCHEMAS_DIR },
  { source: "scripts", destination: AI_LIBRARY_SCRIPTS_DIR },
  { source: "targets", destination: AI_LIBRARY_TARGETS_DIR },
  { source: "skills", destination: AI_LIBRARY_SKILLS_DIR },
  { source: "rules", destination: AI_LIBRARY_RULES_DIR },
  { source: "agents", destination: AI_LIBRARY_AGENTS_DIR },
  { source: "commands", destination: AI_LIBRARY_COMMANDS_DIR },
  { source: "contexts", destination: AI_LIBRARY_CONTEXTS_DIR },
  { source: "docs", destination: AI_LIBRARY_DOCS_DIR },
  { source: "hooks", destination: AI_LIBRARY_HOOKS_DIR },
  { source: "mcp", destination: AI_LIBRARY_MCP_DIR },
  { source: "profiles", destination: AI_LIBRARY_PROFILES_DIR }
] as const;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function rewriteTopLevelReferences(content: string): string {
  let next = content;

  for (const replacement of PATH_REPLACEMENTS) {
    next = next.replace(
      new RegExp(`(?<![A-Za-z0-9./_-])${escapeRegex(replacement.source)}/`, "g"),
      `${replacement.destination}/`
    );
  }

  return next;
}

async function collectTextFiles(entryPath: string, files: string[]): Promise<void> {
  const stats = await fs.stat(entryPath);
  if (stats.isDirectory()) {
    const entries = await fs.readdir(entryPath, { withFileTypes: true });
    for (const entry of entries) {
      await collectTextFiles(path.join(entryPath, entry.name), files);
    }
    return;
  }

  if (TEXT_FILE_EXTENSIONS.has(path.extname(entryPath).toLowerCase())) {
    files.push(entryPath);
  }
}

export async function rewriteInstalledAiLayerReferences(workspaceRoot: string, plan: InstallPlan): Promise<string[]> {
  const candidateEntries = [
    path.join(workspaceRoot, AI_LAYER_LIBRARY_DIR),
    path.join(workspaceRoot, AI_TEMPLATES_DIR),
    path.join(workspaceRoot, ".agents", "skills"),
    ...(plan.visibilityPolicy?.visibleBridgePaths ?? []).filter((entry) =>
      path.basename(entry).endsWith(".md") || path.basename(entry).endsWith(".txt")
    )
  ];
  const files: string[] = [];

  for (const candidateEntry of candidateEntries) {
    if (!(await exists(candidateEntry))) {
      continue;
    }
    await collectTextFiles(candidateEntry, files);
  }

  const rewritten: string[] = [];
  for (const filePath of [...new Set(files)]) {
    const current = await fs.readFile(filePath, "utf8");
    const next = rewriteTopLevelReferences(current);
    if (next === current) {
      continue;
    }

    await fs.writeFile(filePath, next, "utf8");
    rewritten.push(filePath);
  }

  return rewritten;
}
