import fs from "node:fs/promises";
import path from "node:path";
import { generateId } from "../../shared/id-generator.js";
import { nowISO } from "../../shared/timestamps.js";
import { sha256ContentHash } from "../../shared/sha256.js";
import { exists } from "../../shared/fs.js";
import { GraphStore } from "../../infrastructure/cartographer/graph-store.js";
import { rankFiles, rankDocs } from "../../domain/cartographer/context/ranking.js";
import { applyBudget } from "../../domain/cartographer/context/token-budget.js";
import {
  parseContextBundle,
  type ContextBudget,
  type ContextBundle,
  type RankedRef,
  type RecommendedCommand,
} from "../../domain/cartographer/context/context-bundle.js";
import type { ProjectGraph } from "../../domain/cartographer/graph/project-graph.js";
import type { DecisionProvider } from "./decision-provider.js";

export interface CompileContextInput {
  readonly workspaceRoot: string;
  readonly goal: string;
  readonly seedFiles?: readonly string[];
  readonly budget?: ContextBudget;
  readonly decisionProvider: DecisionProvider;
}

export interface CompileContextResult {
  readonly bundle: ContextBundle;
}

const PER_REF_FALLBACK_TOKENS = 400;

function recommendCommands(graph: ProjectGraph): readonly RecommendedCommand[] {
  const out: RecommendedCommand[] = [];
  let priority = 0;
  for (const node of graph.nodes) {
    if (node.kind !== "command") {
      continue;
    }
    const isTest = /test|spec|vitest|jest/i.test(node.name);
    const isBuild = /build|tsc|compile/i.test(node.name);
    if (!isTest && !isBuild) {
      continue;
    }
    out.push({
      command: node.command,
      reason: isTest ? "verifies changed modules via project tests" : "type/build boundary check",
      priority: isTest ? priority : priority + 10,
      cost: node.cost,
      verifies: [],
      source: "graph",
    });
    priority += 1;
  }
  return out.sort((a, b) => a.priority - b.priority);
}

const FRESHNESS_CONCURRENCY = 16;

async function fileChangedSinceIndex(
  workspaceRoot: string,
  filePath: string,
  expectedHash: string,
): Promise<boolean> {
  const abs = path.join(workspaceRoot, filePath);
  if (!(await exists(abs))) {
    return true;
  }
  try {
    return sha256ContentHash(await fs.readFile(abs, "utf8")) !== expectedHash;
  } catch {
    return true;
  }
}

async function computeModifiedSince(
  workspaceRoot: string,
  graph: ProjectGraph,
): Promise<readonly string[]> {
  const fileNodes = graph.nodes.filter(
    (node): node is Extract<typeof node, { kind: "file" }> => node.kind === "file",
  );
  const modified: string[] = [];
  for (let offset = 0; offset < fileNodes.length; offset += FRESHNESS_CONCURRENCY) {
    const batch = fileNodes.slice(offset, offset + FRESHNESS_CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (node) => ({
        path: node.path,
        changed: await fileChangedSinceIndex(workspaceRoot, node.path, node.hash),
      })),
    );
    for (const result of results) {
      if (result.changed) {
        modified.push(result.path);
      }
    }
  }
  return modified.sort();
}

function tokenEstimateFor(graph: ProjectGraph): (ref: RankedRef) => number {
  const sizeById = new Map<string, number>();
  for (const node of graph.nodes) {
    if (node.kind === "file") {
      sizeById.set(node.id, Math.ceil(node.sizeBytes / 4));
    }
  }
  return (ref) => sizeById.get(ref.id) ?? PER_REF_FALLBACK_TOKENS;
}

export async function compileContext(input: CompileContextInput): Promise<CompileContextResult> {
  const budget: ContextBudget = input.budget ?? "medium";
  const store = new GraphStore(input.workspaceRoot);
  const graph = await store.read();
  if (graph === null) {
    throw new Error("no project graph; run 'hforge graph build' first");
  }
  const seedFiles = (input.seedFiles ?? []).map((file) => file.replace(/\\/g, "/"));

  const rankedFiles = rankFiles({ goal: input.goal, seedFiles, graph });
  const fileSelection = applyBudget(rankedFiles, budget, tokenEstimateFor(graph));
  const docs = rankDocs(input.goal, graph);
  const decisions = await input.decisionProvider.relevantDecisions(input.goal, seedFiles);
  const recommendedCommands = recommendCommands(graph);
  const modifiedSinceIndex = await computeModifiedSince(input.workspaceRoot, graph);

  const diagnostics: string[] = [];
  if (fileSelection.truncated) {
    diagnostics.push(
      `context truncated: ${fileSelection.omitted.length} lower-ranked files omitted for the ${budget} budget`,
    );
  }
  if (modifiedSinceIndex.length > 0) {
    diagnostics.push(
      `graph is stale: ${modifiedSinceIndex.length} file(s) changed since last index; rerun 'hforge graph build'`,
    );
  }

  const bundle: ContextBundle = parseContextBundle({
    schemaVersion: 1,
    id: generateId("bundle"),
    goal: input.goal,
    createdAt: nowISO(),
    graphVersion: graph.version,
    budget,
    relevantFiles: fileSelection.selected,
    relevantDocs: docs,
    relevantDecisions: decisions,
    recommendedCommands,
    constraints: decisions
      .filter((ref) => !(ref.title ?? "").includes("(stale)"))
      .map((ref) => `Honor decision ${ref.id}: ${ref.title ?? ref.id}`),
    suggestedSteps: [],
    openQuestions: [],
    diagnostics,
    contextTruncated: fileSelection.truncated,
    graphFreshness: {
      indexedAt: graph.createdAt,
      modifiedSinceIndex,
    },
  });
  return { bundle };
}
