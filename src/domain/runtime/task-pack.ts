import { z } from "zod";

import { architectureSignificanceAssessmentSchema } from "./architecture-significance.js";
import { confidenceLevelSchema, reviewStatusSchema } from "./file-interest.js";

export const taskRequirementSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  rationale: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  affectedModules: z.array(z.string().min(1)).default([]),
  acceptanceCriteria: z.array(z.string().min(1)).default([]),
  nonGoals: z.array(z.string().min(1)).default([]),
  risks: z.array(z.string().min(1)).default([]),
  testImplications: z.array(z.string().min(1)).default([])
});

export const implementationNoteSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    "constraint",
    "warning",
    "optimization",
    "reuse-opportunity",
    "migration-note",
    "inconsistency",
    "architectural-context"
  ]),
  statement: z.string().min(1),
  evidence: z.string().optional(),
  affectedModules: z.array(z.string().min(1)).default([]),
  confidence: confidenceLevelSchema.optional(),
  source: z.string().optional()
});

export const taskPackSchema = z.object({
  taskId: z.string().min(1),
  title: z.string().min(1),
  generatedAt: z.string().min(1),
  basedOnCommit: z.string().optional(),
  targetId: z.string().optional(),
  summary: z.string().min(1),
  requestedOutcome: z.string().optional(),
  constraints: z.array(z.string().min(1)).default([]),
  openQuestions: z.array(z.string().min(1)).default([]),
  impactedModules: z.array(z.string().min(1)).default([]),
  architectureSignificance: architectureSignificanceAssessmentSchema.optional(),
  fileInterestRef: z.string().optional(),
  impactAnalysisRef: z.string().optional(),
  decisionRefs: z.array(z.string().min(1)).default([]),
  asrRefs: z.array(z.string().min(1)).default([]),
  adrRefs: z.array(z.string().min(1)).default([]),
  requirements: z.array(taskRequirementSchema),
  implementationNotes: z.array(implementationNoteSchema),
  acceptanceCriteria: z.array(z.string().min(1)).default([]),
  suggestedSequence: z.array(z.string().min(1)).default([]),
  selectedTemplates: z.array(z.string().min(1)).default([]),
  provenance: z.array(z.string().min(1)).default([]),
  reviewStatus: reviewStatusSchema
});

export type TaskRequirement = z.infer<typeof taskRequirementSchema>;
export type ImplementationNote = z.infer<typeof implementationNoteSchema>;
export type TaskPack = z.infer<typeof taskPackSchema>;

export function parseTaskPack(value: unknown): TaskPack {
  return taskPackSchema.parse(value);
}
