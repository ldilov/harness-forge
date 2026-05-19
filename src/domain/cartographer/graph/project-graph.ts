import { z } from "zod";

import { graphNodeSchema, type GraphNode } from "./graph-node.js";
import { graphEdgeSchema, type GraphEdge, type GraphEdgeKind } from "./graph-edge.js";

export const PROJECT_GRAPH_SCHEMA_VERSION = 1;

export const graphDiagnosticSchema = z.object({
  analyzer: z.string().min(1),
  severity: z.enum(["info", "warning", "error"]),
  message: z.string().min(1),
  path: z.string().optional(),
});

export const projectGraphSchema = z.object({
  schemaVersion: z.literal(PROJECT_GRAPH_SCHEMA_VERSION),
  version: z.string().min(1),
  root: z.string().min(1),
  createdAt: z.string().min(1),
  builderVersion: z.string().min(1),
  nodes: z.array(graphNodeSchema).default([]),
  edges: z.array(graphEdgeSchema).default([]),
  diagnostics: z.array(graphDiagnosticSchema).default([]),
});

export type GraphDiagnostic = z.infer<typeof graphDiagnosticSchema>;
export type ProjectGraph = z.infer<typeof projectGraphSchema>;

export function parseProjectGraph(value: unknown): ProjectGraph {
  return projectGraphSchema.parse(value);
}

export function neighbors(
  graph: ProjectGraph,
  nodeId: string,
  options: { readonly direction?: "out" | "in" | "both"; readonly kinds?: readonly GraphEdgeKind[] } = {},
): readonly GraphEdge[] {
  const direction = options.direction ?? "both";
  const kindFilter = options.kinds;
  return graph.edges.filter((edge) => {
    if (kindFilter !== undefined && !kindFilter.includes(edge.kind)) {
      return false;
    }
    if (direction === "out") {
      return edge.from === nodeId;
    }
    if (direction === "in") {
      return edge.to === nodeId;
    }
    return edge.from === nodeId || edge.to === nodeId;
  });
}

export function findNode(graph: ProjectGraph, nodeId: string): GraphNode | null {
  return graph.nodes.find((node) => node.id === nodeId) ?? null;
}

export function reverseReachable(
  graph: ProjectGraph,
  startId: string,
  options: { readonly kinds?: readonly GraphEdgeKind[]; readonly maxDepth?: number } = {},
): ReadonlyMap<string, number> {
  const kinds = options.kinds;
  const maxDepth = options.maxDepth ?? 5;
  const distances = new Map<string, number>();
  let frontier: string[] = [startId];
  for (let depth = 1; depth <= maxDepth && frontier.length > 0; depth += 1) {
    const next: string[] = [];
    for (const target of frontier) {
      for (const edge of graph.edges) {
        if (edge.to !== target) {
          continue;
        }
        if (kinds !== undefined && !kinds.includes(edge.kind)) {
          continue;
        }
        if (!distances.has(edge.from) && edge.from !== startId) {
          distances.set(edge.from, depth);
          next.push(edge.from);
        }
      }
    }
    frontier = next;
  }
  return distances;
}
