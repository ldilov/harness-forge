#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const json = args.includes("--json");
const dryRun = args.includes("--dry-run");
const packRoot = path.resolve(args.find((value) => !value.startsWith("--")) ?? ".");

const textExtensions = new Set([".md", ".txt", ".json", ".yaml", ".yml"]);

async function listFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return listFiles(absolutePath);
      }

      return [absolutePath];
    })
  );

  return nested.flat();
}

const changed = [];
for (const filePath of await listFiles(packRoot)) {
  if (!textExtensions.has(path.extname(filePath).toLowerCase())) {
    continue;
  }

  const original = await fs.readFile(filePath, "utf8");
  const normalized = `${original.replaceAll("\r\n", "\n").replaceAll("\r", "\n").replace(/\s*$/, "")}\n`;
  if (normalized !== original) {
    changed.push(path.relative(packRoot, filePath).replaceAll("\\", "/"));
    if (!dryRun) {
      await fs.writeFile(filePath, normalized, "utf8");
    }
  }
}

const result = { ok: true, packRoot, changedCount: changed.length, changed };
if (json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(JSON.stringify(result, null, 2));
}
