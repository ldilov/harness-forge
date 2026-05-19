import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_IGNORES = new Set([
  "node_modules",
  ".git",
  "dist",
  "coverage",
  ".hforge",
  ".tmp",
  ".claude",
]);

const SECRET_LIKE =
  /(^|\/)(\.env(\.[^/]*)?|secrets?\.(json|ya?ml|env|txt)|credentials?\.(json|ya?ml|env|txt)|id_(rsa|ed25519|ecdsa)|[^/]*\.(pem|key|p12|pfx|pkcs12|keystore|jks))$/i;

export interface ScannedFile {
  readonly relativePath: string;
  readonly absolutePath: string;
  readonly sizeBytes: number;
}

export async function scanFileTree(workspaceRoot: string): Promise<readonly ScannedFile[]> {
  const out: ScannedFile[] = [];
  await walk(workspaceRoot, workspaceRoot, out);
  return out.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

async function walk(workspaceRoot: string, dir: string, out: ScannedFile[]): Promise<void> {
  let entries: import("node:fs").Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (DEFAULT_IGNORES.has(entry.name)) {
      continue;
    }
    const absolutePath = path.join(dir, entry.name);
    const relativePath = path.relative(workspaceRoot, absolutePath).replace(/\\/g, "/");
    if (entry.isDirectory()) {
      await walk(workspaceRoot, absolutePath, out);
      continue;
    }
    if (!entry.isFile() || SECRET_LIKE.test(relativePath)) {
      continue;
    }
    let sizeBytes = 0;
    try {
      sizeBytes = (await fs.stat(absolutePath)).size;
    } catch {
      continue;
    }
    out.push({ relativePath, absolutePath, sizeBytes });
  }
}

export function languageForPath(relativePath: string): string | undefined {
  const ext = path.extname(relativePath).toLowerCase();
  const table: Record<string, string> = {
    ".ts": "typescript",
    ".tsx": "typescript",
    ".js": "javascript",
    ".jsx": "javascript",
    ".mjs": "javascript",
    ".cjs": "javascript",
    ".py": "python",
    ".go": "go",
    ".rs": "rust",
    ".cs": "csharp",
    ".md": "markdown",
    ".json": "json",
    ".yaml": "yaml",
    ".yml": "yaml",
  };
  return table[ext];
}

export function isTestPath(relativePath: string): boolean {
  return /(\.|\/)(test|spec)\.[tj]sx?$/.test(relativePath) || /(^|\/)tests?\//.test(relativePath);
}

export function isDocPath(relativePath: string): boolean {
  return relativePath.endsWith(".md") || relativePath.endsWith(".markdown");
}
