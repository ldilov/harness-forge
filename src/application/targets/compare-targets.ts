import * as fs from "node:fs";
import * as path from "node:path";
import type {
  TargetComparisonReport,
  CapabilityComparison,
  CapabilitySupport,
  UsagePattern,
} from "../../domain/targets/target-comparison.js";

export interface CompareTargetsInput {
  readonly leftTargetId: string;
  readonly rightTargetId: string;
  readonly workspaceRoot: string;
}

export async function compareTargets(
  input: CompareTargetsInput
): Promise<TargetComparisonReport> {
  const { leftTargetId, rightTargetId, workspaceRoot } = input;

  if (leftTargetId === rightTargetId) {
    throw new Error(`Cannot compare target "${leftTargetId}" to itself.`);
  }

  const matrix = loadCapabilityMatrix(workspaceRoot);
  const leftTarget = matrix.targets.find((t: TargetEntry) => t.targetId === leftTargetId);
  const rightTarget = matrix.targets.find((t: TargetEntry) => t.targetId === rightTargetId);

  if (!leftTarget) throw new Error(`Unknown target: "${leftTargetId}"`);
  if (!rightTarget) throw new Error(`Unknown target: "${rightTargetId}"`);

  const sharedStrengths = deriveSharedStrengths(leftTarget, rightTarget);
  const comparisons = deriveCapabilityComparisons(leftTarget, rightTarget);
  const headline = deriveHeadlineVerdict(leftTarget, rightTarget, comparisons);
  const implications = derivePracticalImplications(comparisons);
  const patterns = deriveUsagePatterns(leftTargetId, rightTargetId, comparisons);

  return {
    generatedAt: new Date().toISOString(),
    leftTargetId,
    rightTargetId,
    sharedStrengths,
    headlineVerdict: headline,
    capabilityComparisons: comparisons,
    practicalImplications: implications,
    recommendedUsagePatterns: patterns,
  };
}

interface CapabilityEntry {
  capabilityId: string;
  supportLevel: string;
  supportMode?: string;
  fallbackBehavior?: string;
  notes?: string;
  confidence?: number;
}

interface TargetEntry {
  targetId: string;
  displayName: string;
  supportLevel: string;
  capabilities: CapabilityEntry[];
}

interface CapabilityMatrix {
  version: number;
  targets: TargetEntry[];
}

function loadCapabilityMatrix(workspaceRoot: string): CapabilityMatrix {
  const matrixPath = path.join(workspaceRoot, "manifests", "catalog", "harness-capability-matrix.json");
  try {
    return JSON.parse(fs.readFileSync(matrixPath, "utf-8")) as CapabilityMatrix;
  } catch {
    throw new Error(`Cannot load capability matrix from ${matrixPath}`);
  }
}

function deriveSharedStrengths(left: TargetEntry, right: TargetEntry): string[] {
  const strengths: string[] = [];
  if (left.supportLevel === "full" && right.supportLevel === "full") {
    strengths.push("Both support the shared hidden .hforge runtime model.");
  }
  const sharedFull = left.capabilities.filter((lc) => {
    const rc = right.capabilities.find((r) => r.capabilityId === lc.capabilityId);
    return lc.supportLevel === "full" && rc?.supportLevel === "full";
  });
  if (sharedFull.length > 0) {
    strengths.push("Both support commands, agents, contexts, and maintenance flows.");
  }
  return strengths.length > 0 ? strengths : ["Shared .hforge canonical runtime layer."];
}

function deriveCapabilityComparisons(
  left: TargetEntry,
  right: TargetEntry
): CapabilityComparison[] {
  const allCapIds = new Set<string>();
  for (const c of left.capabilities) allCapIds.add(c.capabilityId);
  for (const c of right.capabilities) allCapIds.add(c.capabilityId);

  const comparisons: CapabilityComparison[] = [];

  for (const capId of allCapIds) {
    const lc = left.capabilities.find((c) => c.capabilityId === capId);
    const rc = right.capabilities.find((c) => c.capabilityId === capId);

    const leftSupport: CapabilitySupport = {
      supportLevel: (lc?.supportLevel ?? "none") as "full" | "partial" | "none",
      supportMode: (lc?.supportMode ?? "unknown") as CapabilitySupport["supportMode"],
      fallbackBehavior: lc?.fallbackBehavior,
      notes: lc?.notes,
    };

    const rightSupport: CapabilitySupport = {
      supportLevel: (rc?.supportLevel ?? "none") as "full" | "partial" | "none",
      supportMode: (rc?.supportMode ?? "unknown") as CapabilitySupport["supportMode"],
      fallbackBehavior: rc?.fallbackBehavior,
      notes: rc?.notes,
    };

    const winner = determineWinner(leftSupport, rightSupport);
    const impact = deriveOperatorImpact(capId, leftSupport, rightSupport, winner);

    comparisons.push({
      capabilityId: capId,
      capabilityName: formatCapabilityName(capId),
      left: leftSupport,
      right: rightSupport,
      winner,
      operatorImpact: impact,
    });
  }

  return comparisons;
}

function determineWinner(
  left: CapabilitySupport,
  right: CapabilitySupport
): "left" | "right" | "tie" | "depends" {
  const levels: Record<string, number> = { full: 3, partial: 2, none: 1 };
  const lScore = levels[left.supportLevel] ?? 0;
  const rScore = levels[right.supportLevel] ?? 0;
  if (lScore > rScore) return "left";
  if (rScore > lScore) return "right";
  if (left.supportMode === "native" && right.supportMode !== "native") return "left";
  if (right.supportMode === "native" && left.supportMode !== "native") return "right";
  return "tie";
}

function deriveOperatorImpact(
  capId: string,
  left: CapabilitySupport,
  right: CapabilitySupport,
  winner: string
): string {
  if (winner === "tie") {
    return `Either target can be used confidently for ${formatCapabilityName(capId)} workflows.`;
  }
  const stronger = winner === "left" ? left : right;
  const weaker = winner === "left" ? right : left;
  return `${formatCapabilityName(capId)}: ${stronger.supportMode} support (${stronger.supportLevel}) vs ${weaker.supportMode ?? "unknown"} (${weaker.supportLevel}).`;
}

function formatCapabilityName(capId: string): string {
  return capId
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function deriveHeadlineVerdict(
  left: TargetEntry,
  right: TargetEntry,
  comparisons: readonly CapabilityComparison[]
): string {
  const leftWins = comparisons.filter((c) => c.winner === "left").length;
  const rightWins = comparisons.filter((c) => c.winner === "right").length;

  if (leftWins > rightWins) {
    return `${left.displayName ?? left.targetId} has stronger overall capability support, but ${right.displayName ?? right.targetId} may be preferred for specific workflows.`;
  }
  if (rightWins > leftWins) {
    return `${right.displayName ?? right.targetId} has stronger overall capability support, but ${left.displayName ?? left.targetId} may be preferred for specific workflows.`;
  }
  return `Both are first-class runtime targets with complementary strengths.`;
}

function derivePracticalImplications(comparisons: readonly CapabilityComparison[]): string[] {
  const implications: string[] = [];
  const diffs = comparisons.filter((c) => c.winner !== "tie");
  if (diffs.length > 0) {
    implications.push("Dual install is useful for teams that actively use both targets.");
  }
  implications.push("Both targets share the same canonical .hforge runtime layer.");
  return implications;
}

function deriveUsagePatterns(
  leftId: string,
  rightId: string,
  comparisons: readonly CapabilityComparison[]
): UsagePattern[] {
  const patterns: UsagePattern[] = [
    {
      id: "dual-install",
      label: "Dual install",
      whenToChoose: ["Mixed-tool team", "Need one shared runtime with two bridges"],
      caveats: ["Slightly larger visible footprint"],
    },
  ];

  const leftWins = comparisons.filter((c) => c.winner === "left").length;
  const rightWins = comparisons.filter((c) => c.winner === "right").length;

  if (leftWins > 0) {
    patterns.push({
      id: `${leftId}-only`,
      label: `${leftId} only`,
      whenToChoose: [`Strong ${leftId}-specific capability needs`],
      caveats: [`Missing ${rightId}-native capabilities`],
    });
  }
  if (rightWins > 0) {
    patterns.push({
      id: `${rightId}-only`,
      label: `${rightId} only`,
      whenToChoose: [`Strong ${rightId}-specific capability needs`],
      caveats: [`Missing ${leftId}-native capabilities`],
    });
  }

  return patterns;
}
