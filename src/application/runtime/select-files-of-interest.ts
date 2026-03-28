import path from "node:path";

import type { RepoMap } from "../../domain/intelligence/repo-map.js";
import {
  type FileInterestBucket,
  type FileInterestDocument,
  type FileInterestItem
} from "../../domain/runtime/file-interest.js";

export interface CandidateFile {
  path: string;
  role: string;
  module?: string;
  symbols?: string[];
}

export interface SelectFilesOfInterestOptions {
  taskId: string;
  taskText: string;
  repoMap: RepoMap;
  candidateFiles: CandidateFile[];
  basedOnCommit?: string;
  ignorePatterns?: RegExp[];
  keywordBoosts?: Record<string, number>;
}

export interface ArtifactFreshnessContext {
  artifactGeneratedAt?: string;
  repoMapGeneratedAt?: string;
  artifactCommit?: string;
  currentCommit?: string;
}

const DEFAULT_IGNORE_PATTERNS = [
  /(^|\/)node_modules(\/|$)/,
  /(^|\/)dist(\/|$)/,
  /(^|\/)build(\/|$)/,
  /(^|\/)coverage(\/|$)/,
  /(^|\/)\.git(\/|$)/,
  /(^|\/)\.hforge(\/|$)/,
  /\.min\./,
  /\.map$/,
  /\.(png|jpg|jpeg|gif|svg|ico|pdf|zip)$/i
];

function normalizePath(value: string): string {
  return value.replaceAll("\\", "/").toLowerCase();
}

function tokenizeTaskText(taskText: string): string[] {
  return [
    ...new Set(
      taskText
        .toLowerCase()
        .split(/[^a-z0-9]+/g)
        .map((value) => value.trim())
        .filter((value) => value.length > 2)
    )
  ];
}

function bucketForScore(score: number): FileInterestBucket {
  if (score >= 18) return "must-include";
  if (score >= 11) return "strongly-relevant";
  if (score >= 5) return "supporting-context";
  return "ignore-for-now";
}

function confidenceForScore(score: number): "low" | "medium" | "high" {
  if (score >= 18) return "high";
  if (score >= 10) return "medium";
  return "low";
}

function moduleForCandidate(candidate: CandidateFile, repoMap: RepoMap): string | undefined {
  if (candidate.module) {
    return candidate.module;
  }

  const normalizedCandidatePath = normalizePath(candidate.path);
  return repoMap.services.find((service) => {
    const servicePath = normalizePath(service.path);
    return servicePath === "." || normalizedCandidatePath.startsWith(`${servicePath}/`) || normalizedCandidatePath === servicePath;
  })?.id;
}

function relatedTestsForCandidate(candidate: CandidateFile, candidates: CandidateFile[]): string[] {
  const normalizedCandidatePath = normalizePath(candidate.path);
  const basename = path.basename(normalizedCandidatePath, path.extname(normalizedCandidatePath));

  return candidates
    .filter((entry) => entry !== candidate)
    .filter((entry) => entry.role.includes("test"))
    .filter((entry) => {
      const normalizedEntryPath = normalizePath(entry.path);
      return normalizedEntryPath.includes(basename) || basename.includes(path.basename(normalizedEntryPath, path.extname(normalizedEntryPath)));
    })
    .map((entry) => entry.path)
    .slice(0, 4);
}

function relatedAdrsForCandidate(candidate: CandidateFile, candidates: CandidateFile[]): string[] {
  const normalizedCandidatePath = normalizePath(candidate.path);
  const moduleName = normalizedCandidatePath.split("/")[0] ?? "";

  return candidates
    .filter((entry) => entry !== candidate)
    .filter((entry) => entry.role.includes("adr") || entry.role.includes("architecture"))
    .filter((entry) => normalizePath(entry.path).includes(moduleName))
    .map((entry) => entry.path)
    .slice(0, 3);
}

export function evaluateTaskArtifactFreshness(context: ArtifactFreshnessContext): {
  status: "fresh" | "stale";
  reasons: string[];
} {
  const reasons: string[] = [];
  const artifactGeneratedAt = context.artifactGeneratedAt ? Date.parse(context.artifactGeneratedAt) : Number.NaN;
  const repoMapGeneratedAt = context.repoMapGeneratedAt ? Date.parse(context.repoMapGeneratedAt) : Number.NaN;

  if (context.artifactCommit && context.currentCommit && context.artifactCommit !== context.currentCommit) {
    reasons.push("artifact commit does not match current commit");
  }

  if (!Number.isNaN(artifactGeneratedAt) && !Number.isNaN(repoMapGeneratedAt) && artifactGeneratedAt < repoMapGeneratedAt) {
    reasons.push("repo intelligence is newer than the task artifact");
  }

  return {
    status: reasons.length > 0 ? "stale" : "fresh",
    reasons
  };
}

export function selectFilesOfInterest(options: SelectFilesOfInterestOptions): FileInterestDocument {
  const ignorePatterns = options.ignorePatterns ?? DEFAULT_IGNORE_PATTERNS;
  const keywords = tokenizeTaskText(options.taskText);
  const boostedKeywords = options.keywordBoosts ?? {};

  const items: FileInterestItem[] = options.candidateFiles
    .filter((candidate) => !ignorePatterns.some((pattern) => pattern.test(normalizePath(candidate.path))))
    .map((candidate) => {
      const normalizedPath = normalizePath(candidate.path);
      const normalizedSymbols = candidate.symbols?.map((symbol) => symbol.toLowerCase()) ?? [];
      let score = 0;
      const matchedKeywords: string[] = [];
      const reasons: string[] = [];
      const riskTags: string[] = [];

      for (const keyword of keywords) {
        if (normalizedPath.includes(keyword) || normalizedSymbols.some((symbol) => symbol.includes(keyword))) {
          const boost = boostedKeywords[keyword] ?? 5;
          score += boost;
          matchedKeywords.push(keyword);
          reasons.push(`matches task keyword: ${keyword}`);
        }
      }

      if (options.repoMap.highRiskPaths.some((entry) => normalizedPath.includes(normalizePath(entry)))) {
        score += 6;
        riskTags.push("high-risk-path");
        reasons.push("path overlaps with repo high-risk paths");
      }

      if (options.repoMap.criticalPaths.some((entry) => normalizedPath.includes(normalizePath(entry)))) {
        score += 5;
        riskTags.push("critical-path");
        reasons.push("path overlaps with repo critical paths");
      }

      if (candidate.role.includes("entry") || candidate.role.includes("router") || candidate.role.includes("bootstrap")) {
        score += 4;
        reasons.push("candidate looks like an architectural anchor");
      }

      if (candidate.role.includes("test")) {
        score += 2;
        reasons.push("candidate is a test or validation file");
      }

      if (candidate.role.includes("config")) {
        score += 1;
        reasons.push("candidate is configuration that may influence the task");
      }

      const bucket = bucketForScore(score);

      return {
        path: candidate.path,
        role: candidate.role,
        ...(moduleForCandidate(candidate, options.repoMap) ? { module: moduleForCandidate(candidate, options.repoMap) } : {}),
        score,
        bucket,
        matchedKeywords,
        reasons: reasons.length > 0 ? reasons : ["retained as nearby supporting context"],
        riskTags,
        relatedTests: relatedTestsForCandidate(candidate, options.candidateFiles),
        relatedAdrs: relatedAdrsForCandidate(candidate, options.candidateFiles),
        evidence: [
          `keywords=${keywords.join(",")}`,
          `repo-high-risk-count=${options.repoMap.highRiskPaths.length}`,
          `repo-critical-count=${options.repoMap.criticalPaths.length}`
        ],
        confidence: confidenceForScore(score),
        reviewStatus: "inferred" as const,
        ...(options.basedOnCommit ? { lastAnalyzedCommit: options.basedOnCommit } : {})
      };
    })
    .sort((left, right) => right.score - left.score);

  return {
    taskId: options.taskId,
    generatedAt: new Date().toISOString(),
    basedOnCommit: options.basedOnCommit,
    items
  };
}
