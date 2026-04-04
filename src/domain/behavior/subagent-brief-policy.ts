import { z } from 'zod';

export const SUBAGENT_ALLOWED_FIELDS = [
  'objective',
  'scope',
  'relevantDecisions',
  'constraints',
  'latestDelta',
  'references',
  'responseProfile',
  'budget',
] as const;

export const SUBAGENT_DENIED_FIELDS = [
  'fullMemory',
  'fullSessionSummary',
  'fullEventHistory',
  'unrelatedArtifacts',
] as const;

export const SubagentBriefPolicySchema = z.object({
  schemaVersion: z.string().default('1.0.0'),
  allow: z.array(z.string().min(1)).default([...SUBAGENT_ALLOWED_FIELDS]),
  denyByDefault: z.array(z.string().min(1)).default([...SUBAGENT_DENIED_FIELDS]),
  defaultResponseProfile: z.enum(['brief', 'standard', 'deep']).default('brief'),
});

export type SubagentBriefPolicy = z.infer<typeof SubagentBriefPolicySchema>;
