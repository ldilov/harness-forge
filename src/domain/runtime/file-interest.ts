import { z } from "zod";

export const fileInterestBucketSchema = z.enum([
  "must-include",
  "strongly-relevant",
  "supporting-context",
  "ignore-for-now"
]);

export const confidenceLevelSchema = z.enum(["low", "medium", "high"]);
export const reviewStatusSchema = z.enum([
  "draft",
  "inferred",
  "confirmed",
  "approved",
  "stale",
  "superseded"
]);

export const fileInterestItemSchema = z.object({
  path: z.string().min(1),
  role: z.string().min(1),
  module: z.string().optional(),
  score: z.number(),
  bucket: fileInterestBucketSchema,
  matchedKeywords: z.array(z.string().min(1)).default([]),
  reasons: z.array(z.string().min(1)).min(1),
  riskTags: z.array(z.string().min(1)).default([]),
  relatedTests: z.array(z.string().min(1)).default([]),
  relatedAdrs: z.array(z.string().min(1)).default([]),
  evidence: z.array(z.string().min(1)).default([]),
  confidence: confidenceLevelSchema,
  reviewStatus: reviewStatusSchema,
  lastAnalyzedCommit: z.string().optional()
});

export const fileInterestDocumentSchema = z.object({
  taskId: z.string().min(1),
  generatedAt: z.string().min(1),
  basedOnCommit: z.string().optional(),
  items: z.array(fileInterestItemSchema)
});

export type FileInterestBucket = z.infer<typeof fileInterestBucketSchema>;
export type ConfidenceLevel = z.infer<typeof confidenceLevelSchema>;
export type ReviewStatus = z.infer<typeof reviewStatusSchema>;
export type FileInterestItem = z.infer<typeof fileInterestItemSchema>;
export type FileInterestDocument = z.infer<typeof fileInterestDocumentSchema>;

export function parseFileInterestDocument(value: unknown): FileInterestDocument {
  return fileInterestDocumentSchema.parse(value);
}
