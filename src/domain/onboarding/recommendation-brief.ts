import { z } from "zod";
import { evidenceItemSchema } from "../shared/evidence-item.js";

export const recommendationReasonSchema = z.object({
  id: z.string().min(1),
  summary: z.string().min(1),
  importance: z.enum(["high", "medium", "low"]),
});

export type RecommendationReason = z.infer<typeof recommendationReasonSchema>;

export const alternativeRecommendationSchema = z.object({
  id: z.string().min(1),
  summary: z.string().min(1),
  targets: z.array(z.string().min(1)),
  profile: z.string().optional(),
  modules: z.array(z.string().min(1)).optional(),
  tradeOffs: z.array(z.string().min(1)),
});

export type AlternativeRecommendation = z.infer<typeof alternativeRecommendationSchema>;

export const recommendationBriefSchema = z.object({
  generatedAt: z.string().min(1),
  root: z.string().min(1),
  repoType: z.string().min(1),
  recommendedTargets: z.array(z.string().min(1)).min(1),
  recommendedProfile: z.string().min(1),
  recommendedModules: z.array(z.string().min(1)),
  rationale: z.object({
    targets: z.array(recommendationReasonSchema),
    profile: z.array(recommendationReasonSchema),
    modules: z.array(recommendationReasonSchema),
  }),
  evidence: z.array(evidenceItemSchema),
  confidence: z.object({
    targets: z.number().min(0).max(1),
    profile: z.number().min(0).max(1),
    modules: z.number().min(0).max(1),
    overall: z.number().min(0).max(1),
  }),
  caveats: z.array(z.string().min(1)),
  alternatives: z.array(alternativeRecommendationSchema),
});

export type RecommendationBrief = z.infer<typeof recommendationBriefSchema>;

export function parseRecommendationBrief(value: unknown): RecommendationBrief {
  return recommendationBriefSchema.parse(value);
}
