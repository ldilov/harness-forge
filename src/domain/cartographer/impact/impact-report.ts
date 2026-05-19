import { z } from "zod";

import { rankedRefSchema, recommendedCommandSchema } from "../context/context-bundle.js";

export const IMPACT_REPORT_SCHEMA_VERSION = 1;

export const impactRiskSchema = z.enum(["low", "medium", "high", "architectural"]);

export const impactInputSchema = z.object({
  files: z.array(z.string().min(1)).optional(),
  diffPath: z.string().optional(),
  goal: z.string().optional(),
  changedOnly: z.boolean().optional(),
});

export const impactAnalysisSchema = z.object({
  schemaVersion: z.literal(IMPACT_REPORT_SCHEMA_VERSION),
  id: z.string().min(1),
  createdAt: z.string().min(1),
  graphVersion: z.string().min(1),
  input: impactInputSchema,
  changedFiles: z.array(z.string().min(1)).default([]),
  risk: impactRiskSchema,
  impactedFiles: z.array(rankedRefSchema).default([]),
  impactedModules: z.array(rankedRefSchema).default([]),
  impactedDocs: z.array(rankedRefSchema).default([]),
  impactedDecisions: z.array(rankedRefSchema).default([]),
  recommendedCommands: z.array(recommendedCommandSchema).default([]),
  suggestedSplit: z.array(z.string().min(1)).default([]),
  explanation: z.string().min(1),
  confidenceNote: z.string().min(1),
});

export type ImpactRisk = z.infer<typeof impactRiskSchema>;
export type ImpactInput = z.infer<typeof impactInputSchema>;
export type ImpactAnalysis = z.infer<typeof impactAnalysisSchema>;

export function parseImpactAnalysis(value: unknown): ImpactAnalysis {
  return impactAnalysisSchema.parse(value);
}
