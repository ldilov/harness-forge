import { z } from "zod";

export const recursiveAdrPromotionRecommendationSchema = z.enum(["promote", "revise", "hold"]);

export const recursiveAdrCandidateSchema = z.object({
  candidateId: z.string().min(1),
  taskId: z.string().min(1),
  linkedAsrRefs: z.array(z.string().min(1)).default([]),
  title: z.string().min(1),
  context: z.string().min(1),
  decision: z.string().min(1),
  alternatives: z.array(z.string().min(1)).default([]),
  tradeoffs: z.array(z.string().min(1)).default([]),
  evidenceRefs: z.array(z.string().min(1)).min(1),
  consequences: z.array(z.string().min(1)).default([]),
  openQuestions: z.array(z.string().min(1)).default([]),
  promotionRecommendation: recursiveAdrPromotionRecommendationSchema
});

export type RecursiveAdrCandidate = z.infer<typeof recursiveAdrCandidateSchema>;

export function parseRecursiveAdrCandidate(value: unknown): RecursiveAdrCandidate {
  return recursiveAdrCandidateSchema.parse(value);
}
