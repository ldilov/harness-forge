import fs from "node:fs/promises";
import path from "node:path";

import {
  validateCanonicalRuleAuthorship,
  validateFrameworkAssetShape,
  validateLanguageAssetShape,
  validateSeededDerivationPolicy,
  validateWrapperThinness
} from "./lib/context-surface-dedup.mjs";

const root = process.cwd();
const failures = [];

const languageAssets = JSON.parse(await fs.readFile(path.join(root, "manifests", "catalog", "language-assets.json"), "utf8"));
for (const [languageId, entry] of Object.entries(languageAssets.languages ?? {})) {
  failures.push(...validateLanguageAssetShape(languageId, entry));

  const discoverySkill = entry.installedSurfaces?.discoverySkill;
  if (typeof discoverySkill === "string" && discoverySkill.trim()) {
    const wrapperPath = path.join(root, discoverySkill);
    try {
      const wrapper = await fs.readFile(wrapperPath, "utf8");
      failures.push(...validateWrapperThinness(wrapper, path.relative(root, wrapperPath).replaceAll("\\", "/")));
    } catch {
      failures.push({ file: path.relative(root, wrapperPath).replaceAll("\\", "/"), issue: "Missing language discovery wrapper." });
    }
  }
}

const frameworkAssets = JSON.parse(await fs.readFile(path.join(root, "manifests", "catalog", "framework-assets.json"), "utf8"));
for (const framework of frameworkAssets.frameworks ?? []) {
  failures.push(...validateFrameworkAssetShape(framework));
}

const seededManifest = JSON.parse(await fs.readFile(path.join(root, "manifests", "catalog", "seeded-knowledge-files.json"), "utf8"));
failures.push(...validateSeededDerivationPolicy(seededManifest));
failures.push(...(await validateCanonicalRuleAuthorship(root, seededManifest)));

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      languages: Object.keys(languageAssets.languages ?? {}).length,
      frameworks: (frameworkAssets.frameworks ?? []).length
    },
    null,
    2
  )
);
