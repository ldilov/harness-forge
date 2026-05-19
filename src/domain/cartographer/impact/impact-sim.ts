import type { ProjectGraph } from "../graph/project-graph.js";
import type { RankedRef, RecommendedCommand } from "../context/context-bundle.js";
import type { ImpactRisk } from "./impact-report.js";

const HIGH_RISK_PATHS = [
  /^src\/cli\/index\.ts$/,
  /^src\/cli\//,
  /^src\/shared\//,
  /^src\/dashboard\//,
  /^src\/application\/dashboard\//,
  /(^|\/)events?\.ts$/,
  /(^|\/)event-taxonomy\.ts$/,
  /package\.json$/,
  /tsconfig.*\.json$/,
];

const SPLIT_THRESHOLD = 25;

interface ReverseIndex {
  readonly reverse: ReadonlyMap<string, readonly string[]>;
}

function buildReverseIndex(graph: ProjectGraph): ReverseIndex {
  const reverse = new Map<string, string[]>();
  for (const edge of graph.edges) {
    if (edge.kind !== "imports" && edge.kind !== "implements") {
      continue;
    }
    const list = reverse.get(edge.to) ?? reverse.set(edge.to, []).get(edge.to)!;
    list.push(edge.from);
  }
  return { reverse };
}

function reverseReach(
  reverse: ReadonlyMap<string, readonly string[]>,
  seedIds: readonly string[],
  maxDepth: number,
): ReadonlyMap<string, number> {
  const distances = new Map<string, number>();
  const seedSet = new Set(seedIds);
  let frontier: string[] = [...seedIds];
  for (let depth = 1; depth <= maxDepth && frontier.length > 0; depth += 1) {
    const next: string[] = [];
    for (const target of frontier) {
      for (const importer of reverse.get(target) ?? []) {
        if (!seedSet.has(importer) && !distances.has(importer)) {
          distances.set(importer, depth);
          next.push(importer);
        }
      }
    }
    frontier = next;
  }
  return distances;
}

function moduleOf(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, "/");
  const match = /^(src\/[^/]+\/[^/]+)\//.exec(normalized);
  if (match !== null && match[1] !== undefined) {
    return match[1];
  }
  const top = /^([^/]+\/[^/]+)\//.exec(normalized);
  if (top !== null && top[1] !== undefined) {
    return top[1];
  }
  const firstDir = /^([^/]+)\//.exec(normalized);
  if (firstDir !== null && firstDir[1] !== undefined) {
    return firstDir[1];
  }
  return "(root)";
}

export interface ImpactComputation {
  readonly changedFiles: readonly string[];
  readonly risk: ImpactRisk;
  readonly impactedFiles: readonly RankedRef[];
  readonly impactedModules: readonly RankedRef[];
  readonly recommendedCommands: readonly RecommendedCommand[];
  readonly suggestedSplit: readonly string[];
  readonly explanation: string;
  readonly confidenceNote: string;
}

export interface ImpactInputs {
  readonly graph: ProjectGraph;
  readonly changedFiles: readonly string[];
  readonly hasLinkedDecision: boolean;
  readonly speculative?: boolean;
}

function classifyRisk(
  changed: readonly string[],
  transitiveCount: number,
  moduleCount: number,
  hasLinkedDecision: boolean,
): ImpactRisk {
  const touchesArchitecturalPath = changed.some(
    (file) => /^src\/shared\//.test(file) || /^src\/domain\//.test(file) || /^src\/cli\/index\.ts$/.test(file),
  );
  if ((touchesArchitecturalPath && transitiveCount >= 5) || (hasLinkedDecision && transitiveCount >= 3)) {
    return "architectural";
  }
  const touchesHighRiskPath = changed.some((file) => HIGH_RISK_PATHS.some((re) => re.test(file)));
  if (touchesHighRiskPath || transitiveCount >= 5 || moduleCount >= 4) {
    return "high";
  }
  if (transitiveCount >= 2 || moduleCount >= 2) {
    return "medium";
  }
  return "low";
}

function recommendCommands(graph: ProjectGraph): RecommendedCommand[] {
  const out: RecommendedCommand[] = [];
  let priority = 0;
  for (const node of graph.nodes) {
    if (node.kind !== "command") {
      continue;
    }
    const isTest = /test|spec|vitest|jest/i.test(node.name);
    const isBuild = /build|tsc|compile|typecheck/i.test(node.name);
    if (!isTest && !isBuild) {
      continue;
    }
    out.push({
      command: node.command,
      reason: isTest ? "tests verify impacted modules" : "type/build boundary check",
      priority: isTest ? priority : priority + 100,
      cost: node.cost,
      verifies: [],
      source: "graph",
    });
    priority += 1;
  }
  return out.sort((a, b) => a.priority - b.priority);
}

export function computeImpact(inputs: ImpactInputs): ImpactComputation {
  const fileIdByPath = new Map<string, string>();
  const pathById = new Map<string, string>();
  for (const node of inputs.graph.nodes) {
    if (node.kind === "file") {
      fileIdByPath.set(node.path, node.id);
      pathById.set(node.id, node.path);
    }
  }
  const changed = [...new Set(inputs.changedFiles.map((file) => file.replace(/\\/g, "/")))].sort();
  const seedIds = changed.map((file) => fileIdByPath.get(file)).filter((id): id is string => id !== undefined);
  const { reverse } = buildReverseIndex(inputs.graph);
  const distances = reverseReach(reverse, seedIds, 6);

  const impactedFiles: RankedRef[] = [...distances.entries()]
    .map(([id, distance]) => ({ id, path: pathById.get(id), distance }))
    .filter((entry) => entry.path !== undefined)
    .sort((a, b) => a.distance - b.distance || (a.path ?? "").localeCompare(b.path ?? ""))
    .map((entry) => ({
      id: entry.id,
      path: entry.path,
      score: Number((1 / entry.distance).toFixed(3)),
      reason: `transitively imports a changed file (distance ${entry.distance})`,
      evidence: [{ kind: "heuristic" as const, ref: "impact-sim.computeImpact" }],
    }));

  const moduleSet = new Map<string, number>();
  for (const file of [...changed, ...impactedFiles.map((ref) => ref.path ?? "")]) {
    if (file.length === 0) {
      continue;
    }
    const mod = moduleOf(file);
    moduleSet.set(mod, (moduleSet.get(mod) ?? 0) + 1);
  }
  const impactedModules: RankedRef[] = [...moduleSet.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([mod, count]) => ({
      id: `module:${mod}`,
      path: mod,
      score: count,
      reason: `${count} changed/impacted file(s) in this module`,
      evidence: [{ kind: "heuristic" as const, ref: "impact-sim.moduleOf" }],
    }));

  const speculative = inputs.speculative === true;
  const rawRisk = classifyRisk(changed, distances.size, moduleSet.size, inputs.hasLinkedDecision);
  const risk: ImpactRisk = speculative && rawRisk === "architectural" ? "high" : rawRisk;
  const recommendedCommands = recommendCommands(inputs.graph);

  const suggestedSplit: string[] =
    impactedFiles.length > SPLIT_THRESHOLD
      ? [
          "This change appears broad. Consider splitting by impacted module:",
          ...impactedModules.slice(0, 5).map((m, i) => `${i + 1}. Isolate changes in ${m.path}`),
        ]
      : [];

  const seedLabel = speculative ? "predicted seed file(s) (from --goal, not observed changes)" : "changed file(s)";
  const explanation =
    seedIds.length === 0
      ? `The ${changed.length} ${speculative ? "predicted" : "changed"} path(s) are not indexed as file nodes; impact is unknown until 'hforge graph build' includes them.`
      : `${changed.length} ${seedLabel} reach ${distances.size} transitive dependent(s) across ${moduleSet.size} module(s); risk classified ${risk}.`;

  const confidenceNote =
    "Static analysis only: import + implements edges. Runtime coupling (events, DI tokens, dynamic imports) is not captured; treat 'not impacted' as 'no static path found', not a guarantee.";

  return {
    changedFiles: changed,
    risk,
    impactedFiles,
    impactedModules,
    recommendedCommands,
    suggestedSplit,
    explanation,
    confidenceNote,
  };
}
