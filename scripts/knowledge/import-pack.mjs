#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const json = args.includes("--json");
const dryRun = args.includes("--dry-run");
const positionalArgs = args.filter((value) => !value.startsWith("--"));
const [sourceDir, languageId] = positionalArgs;

if (!sourceDir || !languageId) {
  console.error("Usage: node scripts/knowledge/import-pack.mjs <source-dir> <language-id> [--dry-run] [--json]");
  process.exit(1);
}

const root = process.cwd();
const sourceRoot = path.resolve(sourceDir);
const destinationRoot = path.join(root, "knowledge-bases", "structured", languageId);

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

const files = await listFiles(sourceRoot);
const copied = files.map((filePath) => path.relative(sourceRoot, filePath).replaceAll("\\", "/"));

if (!dryRun) {
  await fs.mkdir(destinationRoot, { recursive: true });
  await fs.cp(sourceRoot, destinationRoot, { recursive: true, force: true });
}

const result = {
  ok: true,
  sourceRoot,
  destinationRoot,
  copiedCount: copied.length,
  copied
};

if (json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(JSON.stringify(result, null, 2));
}
