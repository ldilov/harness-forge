import type { RecommendationBrief } from "../../../domain/onboarding/recommendation-brief.js";

export function serializeRecommendationBrief(brief: RecommendationBrief): string {
  return JSON.stringify(brief, null, 2);
}
