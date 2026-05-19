import { z } from "zod";

export const graphEdgeKindSchema = z.enum([
  "imports",
  "exports",
  "contains",
  "tests",
  "verifies",
  "documents",
  "decides",
  "generates",
  "uses-command",
  "belongs-to-feature",
  "similar-to",
  "recently-changed-with",
  "implements",
]);

export const evidenceRefSchema = z.object({
  kind: z.enum(["file", "config", "trace", "decision", "heuristic", "user"]),
  ref: z.string().min(1),
  excerpt: z.string().optional(),
});

export const graphEdgeSchema = z.object({
  id: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
  kind: graphEdgeKindSchema,
  confidence: z.number().min(0).max(1),
  evidence: z.array(evidenceRefSchema).default([]),
});

export type GraphEdgeKind = z.infer<typeof graphEdgeKindSchema>;
export type EvidenceRef = z.infer<typeof evidenceRefSchema>;
export type GraphEdge = z.infer<typeof graphEdgeSchema>;

export function parseGraphEdge(value: unknown): GraphEdge {
  return graphEdgeSchema.parse(value);
}

export function edgeId(from: string, to: string, kind: GraphEdgeKind): string {
  return `${kind}:${from}->${to}`;
}
