import path from "node:path";

import type { RecursiveAnalysisDepth, RecursiveAdapterStatus, RecursiveLanguageCapabilities, RecursiveNativeExecutionStatus } from "../../domain/recursive/language-capabilities.js";
import type { RepoIntelligenceResult } from "../../domain/intelligence/repo-intelligence.js";
import { loadInstallState } from "../../domain/state/install-state.js";
import { recommendBundles } from "../recommendations/recommend-bundles.js";
import { recommendFromIntelligence } from "../recommendations/recommend-from-intelligence.js";

interface RecursiveLanguageSeed {
  languageId: string;
  displayName: string;
  analysisDepth: RecursiveAnalysisDepth;
  adapterStatus: RecursiveAdapterStatus;
  nativeExecutionStatus: RecursiveNativeExecutionStatus;
  notes: string;
}

const RECURSIVE_LANGUAGE_SEEDS: RecursiveLanguageSeed[] = [
  {
    languageId: "typescript",
    displayName: "TypeScript",
    analysisDepth: "semantic",
    adapterStatus: "available",
    nativeExecutionStatus: "disabled",
    notes: "Host-executed structured analysis can inspect TypeScript-rich repositories with semantic support."
  },
  {
    languageId: "java",
    displayName: "Java",
    analysisDepth: "build-aware",
    adapterStatus: "available",
    nativeExecutionStatus: "disabled",
    notes: "Repository-aware structured analysis can follow Java build and service conventions without claiming native JVM execution."
  },
  {
    languageId: "dotnet",
    displayName: ".NET",
    analysisDepth: "build-aware",
    adapterStatus: "available",
    nativeExecutionStatus: "disabled",
    notes: "Structured analysis can inspect .NET solutions and project layouts through host-executed runtime helpers."
  },
  {
    languageId: "powershell",
    displayName: "PowerShell",
    analysisDepth: "semantic",
    adapterStatus: "available",
    nativeExecutionStatus: "disabled",
    notes: "Structured analysis can inspect PowerShell-heavy repositories with strong script-level support."
  },
  {
    languageId: "lua",
    displayName: "Lua",
    analysisDepth: "build-aware",
    adapterStatus: "available",
    nativeExecutionStatus: "disabled",
    notes: "Structured analysis can inspect Lua projects, but promoted execution remains host-scoped rather than native Lua runtime execution."
  },
  {
    languageId: "python",
    displayName: "Python",
    analysisDepth: "build-aware",
    adapterStatus: "degraded",
    nativeExecutionStatus: "unsupported",
    notes: "Repository analysis is available, but native Python execution is not promoted in this rollout phase."
  },
  {
    languageId: "go",
    displayName: "Go",
    analysisDepth: "build-aware",
    adapterStatus: "degraded",
    nativeExecutionStatus: "unsupported",
    notes: "Repository-aware analysis is available for Go modules, but native Go execution is not promoted in this rollout phase."
  },
  {
    languageId: "kotlin",
    displayName: "Kotlin",
    analysisDepth: "build-aware",
    adapterStatus: "degraded",
    nativeExecutionStatus: "unsupported",
    notes: "Kotlin analysis is available through repository-aware adapters, while native execution remains future-scoped."
  },
  {
    languageId: "rust",
    displayName: "Rust",
    analysisDepth: "syntax-aware",
    adapterStatus: "degraded",
    nativeExecutionStatus: "unsupported",
    notes: "Rust support is currently syntax-aware to build-aware depending on workspace evidence; native execution is not promoted."
  },
  {
    languageId: "cpp",
    displayName: "C++",
    analysisDepth: "syntax-aware",
    adapterStatus: "degraded",
    nativeExecutionStatus: "unsupported",
    notes: "C++ analysis is available conservatively through repository structure and source-level evidence, without native execution claims."
  },
  {
    languageId: "php",
    displayName: "PHP",
    analysisDepth: "syntax-aware",
    adapterStatus: "degraded",
    nativeExecutionStatus: "unsupported",
    notes: "PHP analysis is available through repository-aware adapters; native PHP execution is not promoted in this phase."
  },
  {
    languageId: "perl",
    displayName: "Perl",
    analysisDepth: "syntax-aware",
    adapterStatus: "degraded",
    nativeExecutionStatus: "unsupported",
    notes: "Perl analysis is conservative and repository-aware only in the current rollout."
  },
  {
    languageId: "swift",
    displayName: "Swift",
    analysisDepth: "syntax-aware",
    adapterStatus: "degraded",
    nativeExecutionStatus: "unsupported",
    notes: "Swift analysis is repository-aware, while native execution remains explicitly unsupported in the promoted runtime."
  },
  {
    languageId: "shell",
    displayName: "Shell",
    analysisDepth: "build-aware",
    adapterStatus: "degraded",
    nativeExecutionStatus: "unsupported",
    notes: "Shell scripts can be analyzed as repository artifacts, but the promoted runtime does not claim native shell execution parity."
  }
];

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function collectDetectedLanguageIds(intelligence: RepoIntelligenceResult, installedBundles: string[]): Set<string> {
  return new Set([
    ...intelligence.dominantLanguages.map((language) => language.id),
    ...installedBundles.filter((bundleId) => bundleId.startsWith("lang:")).map((bundleId) => bundleId.slice("lang:".length))
  ]);
}

function createUnavailableEntry(seed: RecursiveLanguageSeed, workspaceRoot: string) {
  return {
    languageId: seed.languageId,
    displayName: seed.displayName,
    adapterStatus: "unavailable" as const,
    analysisDepth: "none" as const,
    nativeExecutionStatus: "unsupported" as const,
    notes: `No strong ${seed.displayName} signals were detected for this workspace, so recursive structured analysis does not currently advertise active ${seed.displayName} support.`,
    evidenceRefs: [path.join(workspaceRoot, ".hforge", "runtime", "repo", "scan-summary.json").replaceAll("\\", "/")]
  };
}

function buildEntry(
  seed: RecursiveLanguageSeed,
  workspaceRoot: string,
  intelligence: RepoIntelligenceResult,
  installedBundles: string[]
) {
  const languageSignal = intelligence.dominantLanguages.find((language) => language.id === seed.languageId);
  const installedBundle = installedBundles.includes(`lang:${seed.languageId}`) ? `bundle:lang:${seed.languageId}` : null;

  if (!languageSignal && !installedBundle) {
    return createUnavailableEntry(seed, workspaceRoot);
  }

  return {
    languageId: seed.languageId,
    displayName: seed.displayName,
    adapterStatus: seed.adapterStatus,
    analysisDepth: seed.analysisDepth,
    nativeExecutionStatus: seed.nativeExecutionStatus,
    notes: seed.notes,
    evidenceRefs: unique([
      ...(languageSignal?.evidence ?? []),
      ...(installedBundle ? [installedBundle] : []),
      path.join(workspaceRoot, ".hforge", "runtime", "repo", "recommendations.json").replaceAll("\\", "/")
    ])
  };
}

function createSummary(workspaceRoot: string, detectedLanguageIds: Set<string>): string {
  if (detectedLanguageIds.size === 0) {
    return "Canonical recursive structured-analysis capability map for this workspace. No strong language signals were detected yet, so support remains conservative and mostly unavailable.";
  }

  const names = RECURSIVE_LANGUAGE_SEEDS.filter((seed) => detectedLanguageIds.has(seed.languageId)).map((seed) => seed.displayName);
  return `Canonical recursive structured-analysis capability map for this workspace. Detected language signals: ${names.join(", ")}. Structured runs are host-executed and bounded by policy; native execution posture remains explicitly differentiated.`;
}

export async function deriveRecursiveLanguageCapabilities(
  workspaceRoot: string,
  intelligenceInput?: RepoIntelligenceResult
): Promise<RecursiveLanguageCapabilities> {
  const [state, intelligence, bundleRecommendations] = await Promise.all([
    loadInstallState(workspaceRoot),
    intelligenceInput ? Promise.resolve(intelligenceInput) : recommendFromIntelligence(workspaceRoot),
    recommendBundles(workspaceRoot)
  ]);

  const installedBundles = [...new Set([...(state?.installedBundles ?? []), ...bundleRecommendations])];
  const detectedLanguageIds = collectDetectedLanguageIds(intelligence, installedBundles);

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    workspaceRoot: workspaceRoot.replaceAll("\\", "/"),
    summary: createSummary(workspaceRoot, detectedLanguageIds),
    languages: RECURSIVE_LANGUAGE_SEEDS.map((seed) => buildEntry(seed, workspaceRoot, intelligence, installedBundles))
  };
}
