import { z } from "zod";

const evidenceSignalSchema = z.object({
  id: z.string().min(1),
  confidence: z.number().min(0).max(1),
  evidence: z.array(z.string().min(1))
});

const generatedArtifactSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["repo", "finding", "instruction", "support"]),
  path: z.string().min(1),
  description: z.string().min(1),
  source: z.string().min(1)
});

const languageSignalSchema = evidenceSignalSchema.extend({
  count: z.number().int().nonnegative()
});

const recommendationSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["bundle", "profile", "skill", "validation"]),
  confidence: z.number().min(0).max(1),
  evidence: z.array(z.string().min(1)).min(1),
  why: z.string().min(1)
});

const targetCapabilitySupportSchema = z.object({
  capabilityId: z.string().min(1),
  displayName: z.string().min(1),
  supportLevel: z.enum(["full", "partial", "emulated", "unsupported"]),
  supportMode: z.enum(["native", "translated", "emulated", "documentation-only", "unsupported"]),
  fallbackBehavior: z.string().optional()
});

const targetSupportSummarySchema = z.object({
  targetId: z.string().min(1),
  displayName: z.string().min(1),
  supportLevel: z.enum(["full", "partial", "emulated", "unsupported"]),
  degradedCapabilities: z.array(targetCapabilitySupportSchema)
});

const sharedRuntimeTargetSchema = z.object({
  targetId: z.string().min(1),
  displayName: z.string().min(1),
  supportMode: z.enum(["native", "translated", "documentation-only", "unsupported"]),
  instructionSurfaces: z.array(z.string().min(1)),
  runtimeSurfaces: z.array(z.string().min(1)),
  notes: z.string().optional()
});

const sharedRuntimeSummarySchema = z.object({
  runtimeId: z.string().min(1).optional(),
  rootDir: z.string().min(1),
  generatedAt: z.string().min(1).optional(),
  visibilityMode: z.enum(["hidden-ai-layer"]).optional(),
  durableSurfaces: z
    .array(
      z.object({
        id: z.string().min(1),
        path: z.string().min(1),
        description: z.string().min(1)
      })
    )
    .optional(),
  cacheSurfaces: z
    .array(
      z.object({
        id: z.string().min(1),
        path: z.string().min(1),
        description: z.string().min(1)
      })
    )
    .optional(),
  targets: z.array(sharedRuntimeTargetSchema).optional(),
  baselineArtifacts: z.array(generatedArtifactSchema).optional(),
  discoveryBridges: z
    .array(
      z.object({
        id: z.string().min(1),
        targetId: z.string().min(1),
        kind: z.enum(["instruction", "runtime", "support-doc"]),
        path: z.string().min(1),
        supportMode: z.enum(["native", "translated", "documentation-only", "unsupported"]),
        description: z.string().min(1)
      })
    )
    .optional(),
  authoritativeSurfaces: z.array(z.string().min(1)).optional(),
  visibleBridgePaths: z.array(z.string().min(1)).optional()
});

const repoIntelligenceSchema = z.object({
  generatedAt: z.string().min(1).optional(),
  root: z.string().min(1),
  repoType: z.string().min(1),
  dominantLanguages: z.array(languageSignalSchema),
  frameworkMatches: z.array(evidenceSignalSchema),
  buildSignals: z.array(evidenceSignalSchema),
  testSignals: z.array(evidenceSignalSchema),
  deploymentSignals: z.array(evidenceSignalSchema),
  riskSignals: z.array(evidenceSignalSchema),
  missingValidationSurfaces: z.array(evidenceSignalSchema),
  recommendations: z.object({
    bundles: z.array(recommendationSchema),
    profiles: z.array(recommendationSchema),
    skills: z.array(recommendationSchema),
    validations: z.array(recommendationSchema)
  }),
  sharedRuntime: sharedRuntimeSummarySchema.optional(),
  targetSupport: z.array(targetSupportSummarySchema).optional()
});

export type EvidenceSignal = z.infer<typeof evidenceSignalSchema>;
export type LanguageSignal = z.infer<typeof languageSignalSchema>;
export type RepoRecommendation = z.infer<typeof recommendationSchema>;
export type TargetCapabilitySupport = z.infer<typeof targetCapabilitySupportSchema>;
export type TargetSupportSummary = z.infer<typeof targetSupportSummarySchema>;
export type SharedRuntimeSummary = z.infer<typeof sharedRuntimeSummarySchema>;
export type RepoIntelligenceResult = z.infer<typeof repoIntelligenceSchema>;

export function parseRepoIntelligenceResult(value: unknown): RepoIntelligenceResult {
  return repoIntelligenceSchema.parse(value);
}
