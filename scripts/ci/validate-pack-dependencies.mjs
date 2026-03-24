import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const manifestDir = path.join(root, "manifests", "bundles");
const files = await fs.readdir(manifestDir);
const bundles = [];
const failures = [];

for (const file of files) {
  const manifest = JSON.parse(await fs.readFile(path.join(manifestDir, file), "utf8"));
  bundles.push(...(manifest.bundles ?? []));
}

const ids = new Set(bundles.map((bundle) => bundle.id));

for (const bundle of bundles) {
  for (const dependency of bundle.dependencies ?? []) {
    if (!ids.has(dependency)) {
      failures.push({ issue: "Bundle dependency points to an unknown bundle.", dependency: `${bundle.id} -> ${dependency}` });
    }
  }

  for (const assetPath of bundle.paths ?? []) {
    try {
      await fs.access(path.join(root, assetPath));
    } catch {
      failures.push({ issue: "Bundle path points to a missing file or directory.", bundleId: bundle.id, path: assetPath });
    }
  }
}

const catalogIndex = JSON.parse(await fs.readFile(path.join(root, "manifests", "catalog", "index.json"), "utf8"));
for (const category of ["bundles", "profiles", "targets", "catalogs", "schemas"]) {
  for (const relativePath of catalogIndex[category] ?? []) {
    try {
      await fs.access(path.join(root, relativePath));
    } catch {
      failures.push({ issue: "Catalog index points to a missing file.", category, path: relativePath });
    }
  }
}

const languageAssets = JSON.parse(await fs.readFile(path.join(root, "manifests", "catalog", "language-assets.json"), "utf8"));
for (const [language, entry] of Object.entries(languageAssets.languages ?? {})) {
  for (const relativePath of [entry.knowledgeBase, ...(entry.docs ?? []), ...(entry.rules ?? []), ...(entry.examples ?? [])].filter(Boolean)) {
    try {
      await fs.access(path.join(root, relativePath));
    } catch {
      failures.push({ issue: "Language asset catalog points to a missing file.", language, path: relativePath });
    }
  }
}

const referenceFiles = [
  "docs/templates/authoring.md",
  "docs/quickstart.md",
  "scripts/templates/README.md"
];

for (const relativePath of referenceFiles) {
  const content = await fs.readFile(path.join(root, relativePath), "utf8");
  for (const match of content.matchAll(/scripts\/templates\/[A-Za-z0-9./_-]+/g)) {
    const referencedPath = match[0];
    try {
      await fs.access(path.join(root, referencedPath));
    } catch {
      failures.push({ issue: "Documentation references a missing validator path.", file: relativePath, path: referencedPath });
    }
  }
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, bundles: bundles.length }, null, 2));
