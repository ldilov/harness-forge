import { z } from 'zod';

export const OVERRIDE_CONDITIONS = [
  'explicit_user_request',
  'task_policy_exemption',
  'recovery_debug_mode',
] as const;

export const HistoryExpansionPolicySchema = z.object({
  schemaVersion: z.string().default('1.0.0'),
  defaultAction: z.enum(['deny', 'allow']).default('deny'),
  overrideConditions: z.array(z.string().min(1)).default([...OVERRIDE_CONDITIONS]),
  eventOnDenial: z.boolean().default(true),
});

export type HistoryExpansionPolicy = z.infer<typeof HistoryExpansionPolicySchema>;
