import * as fs from "node:fs";
import * as path from "node:path";
import type { DiagnosisResult } from "../../domain/onboarding/diagnosis-result.js";
import type { EvidenceItem, LanguageSignal } from "../../domain/shared/evidence-item.js";

export interface GenerateDiagnosisInput {
  readonly workspaceRoot: string;
}

export async function generateDiagnosis(
  input: GenerateDiagnosisInput
): Promise<DiagnosisResult> {
  const { workspaceRoot } = input;
  const evidence: EvidenceItem[] = [];
  const languages: LanguageSignal[] = [];
  const frameworks: string[] = [];
  const tooling: string[] = [];
  const targets: string[] = [];
  const risks: string[] = [];

  // Detect languages from file markers
  if (fileExists(workspaceRoot, "package.json")) {
    languages.push({ language: "TypeScript", strength: "high" });
    evidence.push({ id: "ev-pkg", label: "package.json", path: "package.json", signalType: "tooling-signal", summary: "npm package metadata present" });
    tooling.push("npm");

    // Check for frameworks in package.json
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(workspaceRoot, "package.json"), "utf-8"));
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (allDeps["vitest"]) tooling.push("Vitest");
      if (allDeps["jest"]) tooling.push("Jest");
      if (allDeps["react"]) frameworks.push("React");
      if (allDeps["next"]) frameworks.push("Next.js");
      if (allDeps["vue"]) frameworks.push("Vue");
      if (allDeps["express"]) frameworks.push("Express");
    } catch { /* ignore parse errors */ }
  }

  if (fileExists(workspaceRoot, "tsconfig.json")) {
    evidence.push({ id: "ev-tsconfig", label: "tsconfig", path: "tsconfig.json", signalType: "language-signal", summary: "TypeScript configuration present" });
  }

  if (fileExists(workspaceRoot, "go.mod")) {
    languages.push({ language: "Go", strength: "high" });
    evidence.push({ id: "ev-gomod", label: "go.mod", path: "go.mod", signalType: "language-signal", summary: "Go module configuration present" });
  }

  if (fileExists(workspaceRoot, "Cargo.toml")) {
    languages.push({ language: "Rust", strength: "high" });
    evidence.push({ id: "ev-cargo", label: "Cargo.toml", path: "Cargo.toml", signalType: "language-signal", summary: "Rust Cargo configuration present" });
  }

  // Detect existing targets
  if (directoryExists(workspaceRoot, ".codex")) {
    targets.push("codex");
    evidence.push({ id: "ev-codex", label: "Codex bridge", path: ".codex", signalType: "target-marker", summary: "Codex runtime marker present" });
  }

  if (directoryExists(workspaceRoot, ".claude")) {
    targets.push("claude-code");
    evidence.push({ id: "ev-claude", label: "Claude bridge", path: ".claude", signalType: "target-marker", summary: "Claude runtime marker present" });
  }

  // Detect CI/tooling
  if (directoryExists(workspaceRoot, ".github/workflows")) {
    tooling.push("GitHub Actions");
    evidence.push({ id: "ev-gha", label: "GitHub Actions", path: ".github/workflows", signalType: "tooling-signal", summary: "GitHub Actions workflows detected" });
  }

  // Detect markdown presence as secondary language
  const hasReadme = fileExists(workspaceRoot, "README.md") || fileExists(workspaceRoot, "AGENTS.md");
  if (hasReadme) {
    languages.push({ language: "Markdown", strength: "medium" });
  }

  // If no languages detected, mark as generic
  if (languages.length === 0) {
    languages.push({ language: "Unknown", strength: "low" });
  }

  // Determine repo type
  const repoType = deriveRepoType(languages, frameworks, tooling);

  // Compute confidence
  const confidence = computeConfidence(languages, targets, evidence);

  return {
    generatedAt: new Date().toISOString(),
    root: workspaceRoot,
    repoType,
    dominantLanguages: languages,
    frameworkMatches: frameworks,
    toolingSignals: tooling,
    detectedTargets: targets,
    riskSignals: risks,
    topEvidence: evidence.slice(0, 10),
    confidence,
  };
}

function deriveRepoType(
  languages: readonly LanguageSignal[],
  frameworks: readonly string[],
  tooling: readonly string[]
): string {
  const primary = languages.find((l) => l.strength === "high");
  if (!primary) return "generic-repo";

  const lang = primary.language.toLowerCase();
  if (frameworks.length > 0) {
    return `${lang}-${frameworks[0]!.toLowerCase().replace(/[.\s]/g, "")}`;
  }
  if (tooling.includes("npm")) return `${lang}-cli`;
  return `${lang}-repo`;
}

function computeConfidence(
  languages: readonly LanguageSignal[],
  targets: readonly string[],
  evidence: readonly EvidenceItem[]
): number {
  let score = 0.3;
  if (languages.some((l) => l.strength === "high")) score += 0.3;
  if (targets.length > 0) score += 0.2;
  if (evidence.length >= 3) score += 0.2;
  return Math.min(score, 1.0);
}

function fileExists(root: string, relative: string): boolean {
  try {
    return fs.statSync(path.join(root, relative)).isFile();
  } catch {
    return false;
  }
}

function directoryExists(root: string, relative: string): boolean {
  try {
    return fs.statSync(path.join(root, relative)).isDirectory();
  } catch {
    return false;
  }
}
