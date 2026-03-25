#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const scanPaths = [
  "README.md",
  "AGENTS.md",
  "docs",
  "skills",
  ".agents/skills",
  "rules",
  "templates",
  "manifests"
];
const ignorePatterns = [
  /(^|\/)skills\/speckit-/,
  /(^|\/)\.agents\/skills\/speckit-/
];
const patterns = [
  /\[NEEDS CLARIFICATION\]/,
  /\bTODO\b/,
  /\bTBD\b/,
  /REPLACE ME/,
  /INSERT [A-Z]/,
  /lorem ipsum/i
];

async function listFiles(targetPath) {
  const stats = await fs.stat(targetPath);
  if (!stats.isDirectory()) {
    return [targetPath];
  }

  const entries = await fs.readdir(targetPath, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = path.join(targetPath, entry.name);
      if (entry.isDirectory()) {
        return listFiles(absolutePath);
      }

      return [absolutePath];
    })
  );

  return nested.flat();
}

const failures = [];
for (const relativePath of scanPaths) {
  const absolutePath = path.join(root, relativePath);
  try {
    await fs.access(absolutePath);
  } catch {
    continue;
  }

  for (const filePath of await listFiles(absolutePath)) {
    if (!/\.(md|json)$/i.test(filePath)) {
      continue;
    }

    const normalizedPath = path.relative(root, filePath).replaceAll("\\", "/");
    if (ignorePatterns.some((pattern) => pattern.test(normalizedPath))) {
      continue;
    }

    const content = await fs.readFile(filePath, "utf8");
    for (const pattern of patterns) {
      if (pattern.test(content)) {
        failures.push({
          file: normalizedPath,
          pattern: pattern.toString()
        });
      }
    }
  }
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true }, null, 2));
