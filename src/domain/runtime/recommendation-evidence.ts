import { z } from "zod";

export const recommendationEvidenceRecordSchema = z.object({
  subjectType: z.enum(["profile", "pack"]),
  subjectId: z.string().min(1),
  selectedBy: z.enum(["explicit", "profile", "recommendation", "default"]),
  matchedRecommendation: z.boolean(),
  confidence: z.number().min(0).max(1).optional(),
  why: z.string().min(1).optional(),
  evidence: z.array(z.string().min(1)),
  source: z.enum(["repo-intelligence", "explicit-selection"]).optional()
});

export const recommendationEvidenceDocumentSchema = z.object({
  generatedAt: z.string().min(1),
  records: z.array(recommendationEvidenceRecordSchema)
});

export type RecommendationEvidenceRecord = z.infer<typeof recommendationEvidenceRecordSchema>;
export type RecommendationEvidenceDocument = z.infer<typeof recommendationEvidenceDocumentSchema>;

export function parseRecommendationEvidenceDocument(value: unknown): RecommendationEvidenceDocument {
  return recommendationEvidenceDocumentSchema.parse(value);
}
