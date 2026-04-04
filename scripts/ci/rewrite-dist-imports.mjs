#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const distRoot = path.join(root, "dist");

const aliasTargets = new Map([
  ["@app/", "application/"],
  ["@cli/", "cli/"],
  ["@domain/", "domain/"],
  ["@infra/", "infrastructure/"],
  ["@shared/", "shared/"],
]);

async function listFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return listFiles(fullPath);
      }

      if (entry.isFile() && (entry.name.endsWith(".js") || entry.name.endsWith(".d.ts"))) {
        return [fullPath];
      }

      return [];
    }),
  );

  return nested.flat();
}

function resolveAliasPath(filePath, specifier) {
  for (const [aliasPrefix, distPrefix] of aliasTargets.entries()) {
    if (!specifier.startsWith(aliasPrefix)) {
      continue;
    }

    const relativeTarget = specifier.slice(aliasPrefix.length);
    const targetPath = path.join(distRoot, distPrefix, relativeTarget);
    let rewritten = path.relative(path.dirname(filePath), targetPath).replaceAll("\\", "/");
    if (!rewritten.startsWith(".")) {
      rewritten = `./${rewritten}`;
    }
    return rewritten;
  }

  return null;
}

function rewriteContent(filePath, content) {
  let changed = false;

  const rewritten = content.replace(/(["'])(@(?:app|cli|domain|infra|shared)\/[^"']+)\1/g, (fullMatch, quote, specifier) => {
    const nextSpecifier = resolveAliasPath(filePath, specifier);
    if (!nextSpecifier || nextSpecifier === specifier) {
      return fullMatch;
    }

    changed = true;
    return `${quote}${nextSpecifier}${quote}`;
  });

  return { changed, rewritten };
}

async function main() {
  try {
    await fs.access(distRoot);
  } catch {
    console.log(JSON.stringify({ ok: true, rewrittenFiles: 0, reason: "dist-missing" }, null, 2));
    return;
  }

  const files = await listFiles(distRoot);
  let rewrittenFiles = 0;

  for (const filePath of files) {
    const content = await fs.readFile(filePath, "utf8");
    const { changed, rewritten } = rewriteContent(filePath, content);
    if (!changed) {
      continue;
    }

    await fs.writeFile(filePath, rewritten, "utf8");
    rewrittenFiles += 1;
  }

  console.log(JSON.stringify({ ok: true, rewrittenFiles }, null, 2));
}

await main();
