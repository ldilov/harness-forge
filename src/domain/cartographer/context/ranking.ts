import type { ProjectGraph } from "../graph/project-graph.js";
import type { RankedRef } from "./context-bundle.js";

interface ImportAdjacency {
  readonly forward: ReadonlyMap<string, readonly string[]>;
  readonly reverse: ReadonlyMap<string, readonly string[]>;
}

function buildImportAdjacency(graph: ProjectGraph): ImportAdjacency {
  const forward = new Map<string, string[]>();
  const reverse = new Map<string, string[]>();
  for (const edge of graph.edges) {
    if (edge.kind !== "imports") {
      continue;
    }
    (forward.get(edge.from) ?? forward.set(edge.from, []).get(edge.from)!).push(edge.to);
    (reverse.get(edge.to) ?? reverse.set(edge.to, []).get(edge.to)!).push(edge.from);
  }
  return { forward, reverse };
}

function reverseDistances(
  reverse: ReadonlyMap<string, readonly string[]>,
  startId: string,
  maxDepth: number,
): ReadonlyMap<string, number> {
  const distances = new Map<string, number>();
  let frontier: string[] = [startId];
  for (let depth = 1; depth <= maxDepth && frontier.length > 0; depth += 1) {
    const next: string[] = [];
    for (const target of frontier) {
      for (const importer of reverse.get(target) ?? []) {
        if (importer !== startId && !distances.has(importer)) {
          distances.set(importer, depth);
          next.push(importer);
        }
      }
    }
    frontier = next;
  }
  return distances;
}

const STOP_WORDS = new Set([
  "the", "a", "an", "to", "for", "of", "in", "on", "and", "or", "add", "with",
  "this", "that", "into", "from", "make", "use", "using", "support",
]);

export function tokenizeGoal(goal: string): readonly string[] {
  return goal
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

interface ScoredNode {
  readonly id: string;
  readonly path: string;
  readonly score: number;
  readonly reasons: string[];
}

export interface RankingInputs {
  readonly goal: string;
  readonly seedFiles: readonly string[];
  readonly graph: ProjectGraph;
}

export function rankFiles(inputs: RankingInputs): readonly RankedRef[] {
  const keywords = tokenizeGoal(inputs.goal);
  const seedSet = new Set(inputs.seedFiles.map((file) => file.replace(/\\/g, "/")));
  const scored = new Map<string, ScoredNode>();

  for (const node of inputs.graph.nodes) {
    if (node.kind !== "file") {
      continue;
    }
    const reasons: string[] = [];
    let score = 0;
    if (seedSet.has(node.path)) {
      score += 5;
      reasons.push("user-provided seed file");
    }
    const haystack = node.path.toLowerCase();
    const matched = keywords.filter((word) => haystack.includes(word));
    if (matched.length > 0) {
      score += matched.length * 2;
      reasons.push(`goal keywords matched: ${matched.join(", ")}`);
    }
    if (score > 0) {
      scored.set(node.id, { id: node.id, path: node.path, score, reasons });
    }
  }

  const filePathById = new Map<string, string>();
  for (const node of inputs.graph.nodes) {
    if (node.kind === "file") {
      filePathById.set(node.id, node.path);
    }
  }
  const { forward, reverse } = buildImportAdjacency(inputs.graph);
  for (const seed of seedSet) {
    const seedId = `file:${seed}`;
    const importers = reverseDistances(reverse, seedId, 2);
    for (const [importerId, distance] of importers) {
      const importerPath = filePathById.get(importerId);
      if (importerPath === undefined) {
        continue;
      }
      const proximityScore = 3 / distance;
      const existing = scored.get(importerId);
      if (existing !== undefined) {
        scored.set(importerId, {
          ...existing,
          score: existing.score + proximityScore,
          reasons: [...existing.reasons, `imports a seed file (distance ${distance})`],
        });
      } else {
        scored.set(importerId, {
          id: importerId,
          path: importerPath,
          score: proximityScore,
          reasons: [`imports a seed file (distance ${distance})`],
        });
      }
    }
    for (const targetId of forward.get(seedId) ?? []) {
      const targetPath = filePathById.get(targetId);
      if (targetPath === undefined || scored.has(targetId)) {
        continue;
      }
      scored.set(targetId, {
        id: targetId,
        path: targetPath,
        score: 2,
        reasons: ["imported by a seed file"],
      });
    }
  }

  return [...scored.values()]
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
    .map((entry) => ({
      id: entry.id,
      path: entry.path,
      score: Number(entry.score.toFixed(3)),
      reason: entry.reasons.join("; "),
      evidence: [{ kind: "heuristic" as const, ref: "ranking.rankFiles" }],
    }));
}

export function rankDocs(goal: string, graph: ProjectGraph): readonly RankedRef[] {
  const keywords = tokenizeGoal(goal);
  const out: RankedRef[] = [];
  for (const node of graph.nodes) {
    if (node.kind !== "doc") {
      continue;
    }
    const haystack = node.path.toLowerCase();
    const matched = keywords.filter((word) => haystack.includes(word));
    if (matched.length === 0) {
      continue;
    }
    out.push({
      id: node.id,
      path: node.path,
      score: matched.length,
      reason: `doc path matches goal keywords: ${matched.join(", ")}`,
      evidence: [{ kind: "heuristic", ref: "ranking.rankDocs" }],
    });
  }
  return out.sort((a, b) => b.score - a.score || (a.path ?? "").localeCompare(b.path ?? ""));
}
