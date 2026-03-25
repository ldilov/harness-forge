#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const json = args.includes("--json");
const root = path.resolve(args.find((value) => !value.startsWith("--")) ?? ".");

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

const failures = [];
const languageAssets = JSON.parse(
  await fs.readFile(path.join(root, "manifests", "catalog", "language-assets.json"), "utf8")
);
const frameworkAssets = JSON.parse(
  await fs.readFile(path.join(root, "manifests", "catalog", "framework-assets.json"), "utf8")
);

for (const [languageId, entry] of Object.entries(languageAssets.languages ?? {})) {
  const paths = [
    entry.knowledgeBase,
    ...(entry.docs ?? []),
    ...(entry.rules ?? []),
    ...(entry.skills ?? []),
    ...(entry.workflows ?? []),
    ...(entry.examples ?? [])
  ].filter(Boolean);

  for (const relativePath of paths) {
    if (!(await exists(path.join(root, relativePath)))) {
      failures.push({
        type: "language-asset-missing",
        languageId,
        path: relativePath
      });
    }
  }
}

for (const framework of frameworkAssets.frameworks ?? []) {
  if (!(await exists(path.join(root, framework.docPath)))) {
    failures.push({
      type: "framework-doc-missing",
      frameworkId: framework.id,
      path: framework.docPath
    });
  }
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

const result = { ok: true, languages: Object.keys(languageAssets.languages ?? {}).length, frameworks: frameworkAssets.frameworks?.length ?? 0 };
if (json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(JSON.stringify(result, null, 2));
}
