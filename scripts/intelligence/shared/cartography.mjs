import fs from "node:fs/promises";
import path from "node:path";

import { collectRepoFacts } from "../shared.mjs";

const IGNORED_DIRS = new Set([".git", ".hforge", ".next", ".nuxt", ".specify", ".turbo", "build", "coverage", "dist", "node_modules", "vendor"]);
const BOUNDARY_MARKERS = [
  { matcher: (name) => name === "package.json", classification: "package" },
  { matcher: (name) => name === "pyproject.toml", classification: "python-project" },
  { matcher: (name) => name === "go.mod", classification: "go-module" },
  { matcher: (name) => name === "pom.xml", classification: "java-service" },
  { matcher: (name) => /\.csproj$/i.test(name), classification: "dotnet-service" }
];

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function walkDirectories(root, visit, current = root) {
  let entries = [];
  try {
    entries = await fs.readdir(current, { withFileTypes: true });
  } catch {
    return;
  }

  await visit(current, entries);
  for (const entry of entries) {
    if (!entry.isDirectory() || IGNORED_DIRS.has(entry.name)) {
      continue;
    }
    await walkDirectories(root, visit, path.join(current, entry.name));
  }
}

function normalizePath(root, targetPath) {
  const relative = path.relative(root, targetPath).replaceAll("\\", "/");
  return relative.length > 0 ? relative : ".";
}

export async function classifyServiceBoundaries(root) {
  const boundaries = [];
  await walkDirectories(root, async (directory, entries) => {
    const marker = BOUNDARY_MARKERS.find((candidate) => entries.some((entry) => entry.isFile() && candidate.matcher(entry.name)));
    if (!marker) {
      return;
    }

    const relativePath = normalizePath(root, directory);
    boundaries.push({
      id: relativePath === "." ? "workspace-root" : relativePath.replaceAll("/", "-"),
      path: relativePath,
      classification: marker.classification
    });
  });

  if (boundaries.length === 0 && (await exists(path.join(root, "src")))) {
    boundaries.push({
      id: "workspace-root",
      path: ".",
      classification: "source-root"
    });
  }

  return boundaries.sort((left, right) => left.path.localeCompare(right.path));
}

export async function listInstructionSurfaces(root) {
  const candidates = [
    "AGENTS.md",
    "CLAUDE.md",
    ".agents/skills",
    ".codex/config.toml",
    ".claude/settings.local.json",
    ".cursor/rules"
  ];

  const discovered = [];
  for (const candidate of candidates) {
    if (await exists(path.join(root, candidate))) {
      discovered.push(candidate);
    }
  }

  return discovered;
}

export async function buildRepoMap(root) {
  const facts = await collectRepoFacts(root);
  const services = await classifyServiceBoundaries(root);
  const existingInstructionSurfaces = await listInstructionSurfaces(root);
  const criticalPaths = services.slice(0, 3).map((service) => service.path);
  const highRiskPaths = [...new Set(facts.riskSignals.flatMap((signal) => signal.evidence))].slice(0, 6);
  const supportingEvidence = [
    ...facts.dominantLanguages.flatMap((signal) => signal.evidence),
    ...facts.frameworkMatches.flatMap((signal) => signal.evidence),
    ...facts.missingValidationSurfaces.flatMap((signal) => signal.evidence)
  ].slice(0, 12);

  return {
    workspaceId: facts.root,
    workspaceType: facts.repoType,
    dominantLanguages: facts.dominantLanguages.map(({ id, confidence, evidence }) => ({ id, confidence, evidence })),
    frameworks: facts.frameworkMatches.map(({ id, confidence, evidence }) => ({ id, confidence, evidence })),
    services,
    criticalPaths,
    highRiskPaths,
    existingInstructionSurfaces,
    qualityGaps: facts.missingValidationSurfaces.map(({ id, confidence, evidence }) => ({ id, confidence, evidence })),
    supportingEvidence
  };
}
