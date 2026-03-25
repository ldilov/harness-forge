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

const languageAssets = JSON.parse(
  await fs.readFile(path.join(root, "manifests", "catalog", "language-assets.json"), "utf8")
);

const coverage = {};
let totalExistingPaths = 0;
let totalDeclaredPaths = 0;

for (const [languageId, entry] of Object.entries(languageAssets.languages ?? {})) {
  const categories = ["docs", "rules", "skills", "workflows", "examples"];
  const categoryCoverage = {};

  for (const category of categories) {
    const paths = [...new Set((entry[category] ?? []).filter(Boolean))];
    const existing = [];
    const missing = [];

    for (const relativePath of paths) {
      if (await exists(path.join(root, relativePath))) {
        existing.push(relativePath);
      } else {
        missing.push(relativePath);
      }
    }

    categoryCoverage[category] = {
      declared: paths.length,
      existing: existing.length,
      missing: missing.length
    };
    totalExistingPaths += existing.length;
    totalDeclaredPaths += paths.length;
  }

  coverage[languageId] = {
    maturity: entry.maturity,
    knowledgeBase: entry.knowledgeBase,
    categoryCoverage
  };
}

const summary = {
  languages: Object.keys(coverage).length,
  totalDeclaredPaths,
  totalExistingPaths,
  missingPaths: totalDeclaredPaths - totalExistingPaths,
  coverage
};

if (json) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  console.log(
    JSON.stringify(
      {
        languages: summary.languages,
        totalDeclaredPaths,
        totalExistingPaths,
        missingPaths: summary.missingPaths
      },
      null,
      2
    )
  );
}
