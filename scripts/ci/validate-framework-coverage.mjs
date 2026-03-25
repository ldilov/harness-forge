#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const frameworkAssets = JSON.parse(
  await fs.readFile(path.join(root, "manifests", "catalog", "framework-assets.json"), "utf8")
);
const bundleManifest = JSON.parse(
  await fs.readFile(path.join(root, "manifests", "bundles", "frameworks.json"), "utf8")
);
const languageAssets = JSON.parse(
  await fs.readFile(path.join(root, "manifests", "catalog", "language-assets.json"), "utf8")
);
const catalogDoc = await fs.readFile(path.join(root, "docs", "catalog", "framework-packs.md"), "utf8");

const failures = [];
for (const framework of frameworkAssets.frameworks ?? []) {
  const bundle = (bundleManifest.bundles ?? []).find((entry) => entry.id === framework.bundleId);
  if (!bundle) {
    failures.push({ frameworkId: framework.id, issue: "Missing framework bundle manifest." });
    continue;
  }

  if (!bundle.paths.includes(framework.docPath)) {
    failures.push({ frameworkId: framework.id, issue: "Bundle does not include framework doc path." });
  }

  try {
    await fs.access(path.join(root, framework.docPath));
  } catch {
    failures.push({ frameworkId: framework.id, issue: "Framework doc path is missing.", path: framework.docPath });
  }

  if (!catalogDoc.includes(`\`${framework.id}\``)) {
    failures.push({ frameworkId: framework.id, issue: "Framework catalog doc is missing the framework id." });
  }

  const referencedByLanguage = Object.values(languageAssets.languages ?? {}).some((entry) =>
    (entry.frameworkBundles ?? []).includes(framework.bundleId)
  );
  if (!referencedByLanguage) {
    failures.push({ frameworkId: framework.id, issue: "No language pack references this framework bundle." });
  }
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, frameworks: frameworkAssets.frameworks?.length ?? 0 }, null, 2));
