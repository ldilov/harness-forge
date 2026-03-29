import path from "node:path";

import { exists, readTextFile, writeTextFile } from "../../shared/index.js";

const HFORGE_GITIGNORE_ENTRIES = [".hforge/", ".hforge/cache/", ".hforge/exports/"] as const;

export async function ensureInstallGitignoreEntries(workspaceRoot: string): Promise<string | null> {
  const gitignorePath = path.join(workspaceRoot, ".gitignore");
  const current = (await exists(gitignorePath)) ? await readTextFile(gitignorePath) : "";
  const lines = current
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const nextEntries = HFORGE_GITIGNORE_ENTRIES.filter((entry) => !lines.includes(entry));

  if (nextEntries.length === 0) {
    return null;
  }

  const prefix = current.length === 0 ? "" : current.endsWith("\n") ? "" : "\n";
  const next = `${current}${prefix}${nextEntries.join("\n")}\n`;
  await writeTextFile(gitignorePath, next);
  return gitignorePath;
}
