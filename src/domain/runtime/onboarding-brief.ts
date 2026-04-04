import { z } from "zod";

export const onboardingBriefSchema = z.object({
  schemaVersion: z.string().min(1),
  generatedAt: z.string().min(1),
  repoType: z.string().min(1),
  detectedLanguages: z.array(z.string().min(1)),
  detectedFrameworks: z.array(z.string().min(1)),
  keyBoundaries: z.array(z.string().min(1)),
  selectedTargets: z.array(z.string().min(1)),
  selectedProfile: z.string().min(1),
  recommendedBundles: z.array(z.string().min(1)),
  primaryWorkflowRecommendation: z.string().min(1),
  nextBestCommand: z.string().min(1),
  alternateCommands: z.array(z.string().min(1)).max(2),
  knownCautions: z.array(z.string().min(1)),
  headline: z.string().min(1)
});

export type OnboardingBrief = z.infer<typeof onboardingBriefSchema>;

export function parseOnboardingBrief(value: unknown): OnboardingBrief {
  return onboardingBriefSchema.parse(value);
}
