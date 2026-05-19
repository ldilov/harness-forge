import fs from "node:fs/promises";
import path from "node:path";
import { exists } from "../../../shared/fs.js";

export interface ScannedCommand {
  readonly name: string;
  readonly command: string;
  readonly cost: "cheap" | "medium" | "expensive" | "unknown";
}

function costFor(name: string, command: string): ScannedCommand["cost"] {
  const haystack = `${name} ${command}`.toLowerCase();
  if (/(^|\s)(build|e2e|release|publish|playwright)/.test(haystack)) {
    return "expensive";
  }
  if (/(test|coverage|validate|lint|typecheck|tsc)/.test(haystack)) {
    return "medium";
  }
  if (/(status|doctor|echo|format|prettier)/.test(haystack)) {
    return "cheap";
  }
  return "unknown";
}

export async function scanPackageScripts(workspaceRoot: string): Promise<readonly ScannedCommand[]> {
  const pkgPath = path.join(workspaceRoot, "package.json");
  if (!(await exists(pkgPath))) {
    return [];
  }
  let parsed: { readonly scripts?: Record<string, string> };
  try {
    parsed = JSON.parse(await fs.readFile(pkgPath, "utf8")) as { readonly scripts?: Record<string, string> };
  } catch {
    return [];
  }
  const scripts = parsed.scripts ?? {};
  return Object.entries(scripts)
    .map(([name, command]) => ({
      name,
      command: `npm run ${name}`,
      cost: costFor(name, command),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
