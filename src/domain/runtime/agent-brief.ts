import { z } from "zod";

export const agentBriefSupportModeSchema = z.enum(["first-class", "compatible", "partial", "unsupported"]);
export const agentBriefFreshnessStatusSchema = z.enum(["current", "stale", "partial", "missing"]);

export const briefTargetSummarySchema = z.object({
  targetId: z.string().min(1),
  displayName: z.string().min(1),
  supportMode: agentBriefSupportModeSchema,
  bridgeSurfaces: z.array(z.string().min(1)),
  caveats: z.array(z.string().min(1)),
  recommendedBehavior: z.string().min(1)
});

export const briefFreshnessSchema = z.object({
  status: agentBriefFreshnessStatusSchema,
  reason: z.string().min(1),
  recommendedAction: z.string().min(1)
});

export const agentStartBriefSchema = z.object({
  schemaVersion: z.literal("1.0.0"),
  workspace: z.object({
    root: z.string().min(1),
    label: z.string().min(1)
  }),
  generatedAt: z.string().datetime(),
  sourceRefs: z.array(z.string().min(1)),
  detectedStack: z.array(z.string().min(1)),
  targets: z.array(briefTargetSummarySchema),
  authoritativeSurfaces: z.array(z.string().min(1)).min(1),
  commandResolution: z.array(z.string().min(1)).min(1),
  recommendedNextActions: z.array(z.string().min(1)).max(6),
  freshness: briefFreshnessSchema,
  fallbackGuidance: z.array(z.string().min(1)),
  orientation: z.object({
    firstRun: z.string().min(1),
    sessionStart: z.string().min(1),
    deeperWork: z.string().min(1)
  })
});

export type AgentBriefSupportMode = z.infer<typeof agentBriefSupportModeSchema>;
export type AgentBriefFreshnessStatus = z.infer<typeof agentBriefFreshnessStatusSchema>;
export type BriefTargetSummary = z.infer<typeof briefTargetSummarySchema>;
export type BriefFreshness = z.infer<typeof briefFreshnessSchema>;
export type AgentStartBrief = z.infer<typeof agentStartBriefSchema>;

export function parseAgentStartBrief(value: unknown): AgentStartBrief {
  return agentStartBriefSchema.parse(value);
}
