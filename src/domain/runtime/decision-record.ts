import { z } from "zod";

import { architectureSignificanceLevelSchema } from "./architecture-significance.js";
import { reviewStatusSchema } from "./file-interest.js";

export const decisionRecordStatusSchema = z.enum(["proposed", "accepted", "rejected", "deferred", "superseded"]);

const decisionRecordBaseSchema = z.object({
  id: z.string().min(1),
  recordType: z.enum(["asr", "adr"]),
  title: z.string().min(1),
  status: decisionRecordStatusSchema,
  reviewStatus: reviewStatusSchema,
  architectureSignificance: architectureSignificanceLevelSchema,
  taskRefs: z.array(z.string().min(1)).default([]),
  requirementRefs: z.array(z.string().min(1)).default([]),
  fileInterestRef: z.string().optional(),
  impactAnalysisRef: z.string().optional(),
  templateId: z.string().optional(),
  owner: z.string().optional(),
  approver: z.string().optional(),
  provenance: z.array(z.string().min(1)).default([]),
  tags: z.array(z.string().min(1)).default([]),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1)
});

export const asrRecordSchema = decisionRecordBaseSchema.extend({
  recordType: z.literal("asr"),
  summary: z.string().min(1),
  problemStatement: z.string().min(1),
  drivers: z.array(z.string().min(1)).default([]),
  qualityAttributes: z.array(z.string().min(1)).default([]),
  constraints: z.array(z.string().min(1)).default([]),
  affectedModules: z.array(z.string().min(1)).default([]),
  affectedFiles: z.array(z.string().min(1)).default([]),
  risks: z.array(z.string().min(1)).default([]),
  openQuestions: z.array(z.string().min(1)).default([]),
  optionsToEvaluate: z.array(z.string().min(1)).default([]),
  promotionCriteria: z.array(z.string().min(1)).default([])
});

export const adrRecordSchema = decisionRecordBaseSchema.extend({
  recordType: z.literal("adr"),
  asrRef: z.string().min(1),
  decisionSummary: z.string().min(1),
  context: z.string().min(1),
  optionsConsidered: z.array(z.string().min(1)).default([]),
  decision: z.string().min(1),
  consequences: z.array(z.string().min(1)).default([]),
  validationPlan: z.array(z.string().min(1)).default([]),
  rolloutPlan: z.array(z.string().min(1)).default([]),
  risksAndMitigations: z.array(z.string().min(1)).default([]),
  followUps: z.array(z.string().min(1)).default([]),
  supersedes: z.array(z.string().min(1)).default([]),
  supersededBy: z.array(z.string().min(1)).default([])
});

export const decisionRecordSchema = z.discriminatedUnion("recordType", [asrRecordSchema, adrRecordSchema]);

export const decisionIndexEntrySchema = z.object({
  id: z.string().min(1),
  recordType: z.enum(["asr", "adr"]),
  path: z.string().min(1),
  title: z.string().min(1),
  status: decisionRecordStatusSchema,
  architectureSignificance: architectureSignificanceLevelSchema,
  taskRefs: z.array(z.string().min(1)).default([]),
  supersedes: z.array(z.string().min(1)).default([]),
  supersededBy: z.array(z.string().min(1)).default([]),
  reviewStatus: reviewStatusSchema,
  updatedAt: z.string().min(1)
});

export const decisionIndexSchema = z.object({
  version: z.number().int().positive(),
  generatedAt: z.string().min(1),
  entries: z.array(decisionIndexEntrySchema)
});

export type DecisionRecordStatus = z.infer<typeof decisionRecordStatusSchema>;
export type AsrRecord = z.infer<typeof asrRecordSchema>;
export type AdrRecord = z.infer<typeof adrRecordSchema>;
export type DecisionRecord = z.infer<typeof decisionRecordSchema>;
export type DecisionIndexEntry = z.infer<typeof decisionIndexEntrySchema>;
export type DecisionIndex = z.infer<typeof decisionIndexSchema>;

export function parseDecisionRecord(value: unknown): DecisionRecord {
  return decisionRecordSchema.parse(value);
}

export function parseDecisionIndex(value: unknown): DecisionIndex {
  return decisionIndexSchema.parse(value);
}
