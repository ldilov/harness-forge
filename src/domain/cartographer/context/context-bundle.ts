import { z } from "zod";

import { evidenceRefSchema } from "../graph/graph-edge.js";

export const CONTEXT_BUNDLE_SCHEMA_VERSION = 1;

export const contextBudgetSchema = z.enum(["small", "medium", "large"]);

export const rankedRefSchema = z.object({
  id: z.string().min(1),
  path: z.string().optional(),
  title: z.string().optional(),
  score: z.number(),
  reason: z.string().min(1),
  evidence: z.array(evidenceRefSchema).default([]),
});

export const recommendedCommandSchema = z.object({
  command: z.string().min(1),
  reason: z.string().min(1),
  priority: z.number().int().nonnegative(),
  cost: z.enum(["cheap", "medium", "expensive", "unknown"]),
  verifies: z.array(z.string().min(1)).default([]),
  source: z.enum(["graph", "config", "package-json", "decision", "heuristic", "agent-trigger"]),
});

export const graphFreshnessSchema = z.object({
  indexedAt: z.string().min(1),
  modifiedSinceIndex: z.array(z.string().min(1)).default([]),
});

export const contextBundleSchema = z.object({
  schemaVersion: z.literal(CONTEXT_BUNDLE_SCHEMA_VERSION),
  id: z.string().min(1),
  goal: z.string().min(1),
  createdAt: z.string().min(1),
  graphVersion: z.string().min(1),
  budget: contextBudgetSchema,
  relevantFiles: z.array(rankedRefSchema).default([]),
  relevantDocs: z.array(rankedRefSchema).default([]),
  relevantDecisions: z.array(rankedRefSchema).default([]),
  recommendedCommands: z.array(recommendedCommandSchema).default([]),
  constraints: z.array(z.string().min(1)).default([]),
  suggestedSteps: z.array(z.string().min(1)).default([]),
  openQuestions: z.array(z.string().min(1)).default([]),
  diagnostics: z.array(z.string().min(1)).default([]),
  contextTruncated: z.boolean(),
  graphFreshness: graphFreshnessSchema,
});

export type ContextBudget = z.infer<typeof contextBudgetSchema>;
export type RankedRef = z.infer<typeof rankedRefSchema>;
export type RecommendedCommand = z.infer<typeof recommendedCommandSchema>;
export type GraphFreshness = z.infer<typeof graphFreshnessSchema>;
export type ContextBundle = z.infer<typeof contextBundleSchema>;

export function parseContextBundle(value: unknown): ContextBundle {
  return contextBundleSchema.parse(value);
}
