import { z } from "zod";

export const decisionCoverageSummarySchema = z.object({
  generatedAt: z.string().min(1),
  significantTaskCount: z.number().int().min(0),
  taskCountWithAsr: z.number().int().min(0),
  taskCountWithAdr: z.number().int().min(0),
  missingCoverageTaskRefs: z.array(z.string().min(1)).default([]),
  staleDecisionRefs: z.array(z.string().min(1)).default([]),
  staleTaskRefs: z.array(z.string().min(1)).default([])
});

export type DecisionCoverageSummary = z.infer<typeof decisionCoverageSummarySchema>;

export function parseDecisionCoverageSummary(value: unknown): DecisionCoverageSummary {
  return decisionCoverageSummarySchema.parse(value);
}
