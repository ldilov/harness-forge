import { z } from "zod";

export const recursiveAdapterStatusSchema = z.enum(["unavailable", "available", "degraded"]);
export const recursiveAnalysisDepthSchema = z.enum(["none", "syntax-aware", "build-aware", "semantic"]);
export const recursiveNativeExecutionStatusSchema = z.enum(["unsupported", "disabled", "available"]);

export const recursiveLanguageCapabilitySchema = z.object({
  languageId: z.string().min(1),
  displayName: z.string().min(1),
  adapterStatus: recursiveAdapterStatusSchema,
  analysisDepth: recursiveAnalysisDepthSchema,
  nativeExecutionStatus: recursiveNativeExecutionStatusSchema,
  notes: z.string().min(1),
  evidenceRefs: z.array(z.string().min(1)).optional()
});

export const recursiveLanguageCapabilitiesSchema = z.object({
  version: z.number().int().positive(),
  generatedAt: z.string().min(1),
  workspaceRoot: z.string().min(1),
  summary: z.string().min(1),
  languages: z.array(recursiveLanguageCapabilitySchema)
});

export type RecursiveAdapterStatus = z.infer<typeof recursiveAdapterStatusSchema>;
export type RecursiveAnalysisDepth = z.infer<typeof recursiveAnalysisDepthSchema>;
export type RecursiveNativeExecutionStatus = z.infer<typeof recursiveNativeExecutionStatusSchema>;
export type RecursiveLanguageCapability = z.infer<typeof recursiveLanguageCapabilitySchema>;
export type RecursiveLanguageCapabilities = z.infer<typeof recursiveLanguageCapabilitiesSchema>;

export function parseRecursiveLanguageCapabilities(value: unknown): RecursiveLanguageCapabilities {
  return recursiveLanguageCapabilitiesSchema.parse(value);
}
