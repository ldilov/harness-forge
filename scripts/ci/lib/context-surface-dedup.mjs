import fs from "node:fs/promises";
import path from "node:path";

export function parseFrontMatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return null;
  }

  const metadata = {};
  let currentArrayKey = null;

  for (const line of match[1].replaceAll("\r", "").split("\n")) {
    if (!line.trim()) {
      continue;
    }

    const arrayItemMatch = line.match(/^\s*-\s+(.*)$/);
    if (arrayItemMatch && currentArrayKey) {
      metadata[currentArrayKey].push(parseScalar(arrayItemMatch[1]));
      continue;
    }

    const keyMatch = line.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/);
    if (!keyMatch) {
      continue;
    }

    const [, key, rawValue = ""] = keyMatch;
    if (rawValue.trim() === "") {
      metadata[key] = [];
      currentArrayKey = key;
      continue;
    }

    metadata[key] = parseScalar(rawValue);
    currentArrayKey = null;
  }

  return { metadata, body: match[2] ?? "" };
}

function parseScalar(value) {
  const trimmed = value.trim();
  if (trimmed === "true") {
    return true;
  }

  if (trimmed === "false") {
    return false;
  }

  if ((trimmed.startsWith("\"") && trimmed.endsWith("\"")) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function normalizeRuleContent(content) {
  return content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").replace(/\s+/g, " ").trim();
}

export function validateWrapperThinness(content, wrapperPath) {
  const failures = [];
  const parsed = parseFrontMatter(content);
  if (!parsed) {
    return [{ file: wrapperPath, issue: "Wrapper is missing front matter." }];
  }

  if (parsed.metadata.generated !== true) {
    failures.push({ file: wrapperPath, issue: "Wrapper must declare generated: true." });
  }

  if (typeof parsed.metadata.canonical_source !== "string" || !parsed.metadata.canonical_source.trim()) {
    failures.push({ file: wrapperPath, issue: "Wrapper must declare canonical_source." });
  }

  if (!parsed.body.includes("discovery-only")) {
    failures.push({ file: wrapperPath, issue: "Wrapper must state that it is discovery-only." });
  }

  if (!parsed.body.includes("canonical execution")) {
    failures.push({ file: wrapperPath, issue: "Wrapper must point readers to the canonical execution surface." });
  }

  const nonEmptyLines = parsed.body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (nonEmptyLines.length > 26) {
    failures.push({ file: wrapperPath, issue: "Wrapper exceeds the thin-surface line budget." });
  }

  return failures;
}

export function validateLanguageAssetShape(languageId, entry) {
  const failures = [];
  for (const field of ["displayName", "authorshipMode", "activationSummary", "bestFitSummary", "generatedSurfaces"]) {
    if (!(field in entry)) {
      failures.push({ languageId, issue: `Missing required field ${field}.` });
    }
  }

  if (!["authored", "generated", "hybrid"].includes(entry.authorshipMode)) {
    failures.push({ languageId, issue: `Unsupported authorshipMode ${String(entry.authorshipMode)}.` });
  }

  if (!Array.isArray(entry.generatedSurfaces)) {
    failures.push({ languageId, issue: "generatedSurfaces must be an array." });
  }

  return failures;
}

export function validateFrameworkAssetShape(framework) {
  const failures = [];
  for (const field of ["authorshipMode", "ownershipNotes"]) {
    if (!(field in framework)) {
      failures.push({ frameworkId: framework.id, issue: `Missing required field ${field}.` });
    }
  }

  if (!["authored", "hybrid"].includes(framework.authorshipMode)) {
    failures.push({ frameworkId: framework.id, issue: `Unsupported authorshipMode ${String(framework.authorshipMode)}.` });
  }

  return failures;
}

export function validateSeededDerivationPolicy(manifest) {
  const failures = [];
  const policy = manifest.derivationPolicy;
  if (!policy || typeof policy !== "object") {
    return [{ issue: "Seeded coverage manifest is missing derivationPolicy." }];
  }

  const derivedKinds = Array.isArray(policy.derivedContentKinds) ? policy.derivedContentKinds : [];
  for (const requiredKind of ["common-rule", "language-rule"]) {
    if (!derivedKinds.includes(requiredKind)) {
      failures.push({ issue: `derivationPolicy is missing derived content kind ${requiredKind}.` });
    }
  }

  if (!policy.canonicalRoots || typeof policy.canonicalRoots !== "object") {
    failures.push({ issue: "derivationPolicy is missing canonicalRoots." });
  }

  return failures;
}

export async function validateCanonicalRuleAuthorship(root, manifest) {
  const failures = [];
  const derivationPolicy = manifest.derivationPolicy ?? {};
  const derivedKinds = new Set(derivationPolicy.derivedContentKinds ?? []);

  for (const entry of manifest.files ?? []) {
    if (!derivedKinds.has(entry.contentKind)) {
      continue;
    }

    const seededPath = path.join(root, entry.packagePath);
    const canonicalRelativePath = entry.relativePath;
    const canonicalPath = path.join(root, canonicalRelativePath);

    try {
      const [seededContent, canonicalContent] = await Promise.all([
        fs.readFile(seededPath, "utf8"),
        fs.readFile(canonicalPath, "utf8")
      ]);

      if (normalizeRuleContent(seededContent) !== normalizeRuleContent(canonicalContent)) {
        failures.push({
          file: entry.packagePath,
          issue: "Derived rule surface no longer matches its canonical rule source.",
          canonicalSource: canonicalRelativePath
        });
      }
    } catch (error) {
      failures.push({
        file: entry.packagePath,
        issue: "Unable to compare derived rule surface to canonical rule source.",
        canonicalSource: canonicalRelativePath,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  return failures;
}
