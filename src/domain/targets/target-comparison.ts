import { z } from "zod";

export const capabilitySupportSchema = z.object({
  supportLevel: z.enum(["full", "partial", "none"]),
  supportMode: z.enum(["native", "translated", "documentation-only", "manual", "unknown"]),
  fallbackBehavior: z.string().optional(),
  notes: z.string().optional(),
});

export type CapabilitySupport = z.infer<typeof capabilitySupportSchema>;

export const capabilityComparisonSchema = z.object({
  capabilityId: z.string().min(1),
  capabilityName: z.string().min(1),
  left: capabilitySupportSchema,
  right: capabilitySupportSchema,
  winner: z.enum(["left", "right", "tie", "depends"]),
  operatorImpact: z.string().min(1),
});

export type CapabilityComparison = z.infer<typeof capabilityComparisonSchema>;

export const usagePatternSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  whenToChoose: z.array(z.string().min(1)),
  caveats: z.array(z.string().min(1)),
});

export type UsagePattern = z.infer<typeof usagePatternSchema>;

export const targetComparisonReportSchema = z.object({
  generatedAt: z.string().min(1),
  leftTargetId: z.string().min(1),
  rightTargetId: z.string().min(1),
  sharedStrengths: z.array(z.string().min(1)),
  headlineVerdict: z.string().min(1),
  capabilityComparisons: z.array(capabilityComparisonSchema),
  practicalImplications: z.array(z.string().min(1)),
  recommendedUsagePatterns: z.array(usagePatternSchema),
});

export type TargetComparisonReport = z.infer<typeof targetComparisonReportSchema>;

export function parseTargetComparisonReport(value: unknown): TargetComparisonReport {
  return targetComparisonReportSchema.parse(value);
}
