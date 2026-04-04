import { z } from 'zod';

export const BriefDecisionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  rationale: z.string().min(1),
});

export type BriefDecision = z.infer<typeof BriefDecisionSchema>;

export const BriefBudgetSchema = z.object({
  maxInputTokens: z.number().int().min(0),
  maxOutputTokens: z.number().int().min(0),
});

export const SubagentBriefSchema = z.object({
  briefId: z.string().min(1),
  generatedAt: z.string().min(1),
  objective: z.string().min(1),
  scope: z.string().min(1),
  relevantDecisions: z.array(BriefDecisionSchema).default([]),
  constraints: z.array(z.string()).default([]),
  latestDelta: z.array(z.string()).default([]),
  references: z.array(z.string()).default([]),
  responseProfile: z.enum(['brief', 'standard', 'deep']).default('brief'),
  budget: BriefBudgetSchema,
  estimatedTokens: z.number().int().min(0),
  sourceStateType: z.enum(['compacted', 'live']).default('compacted'),
});

export type SubagentBrief = z.infer<typeof SubagentBriefSchema>;
