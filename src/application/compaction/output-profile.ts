import { z } from 'zod';

export const OutputProfileSchema = z.enum(['brief', 'standard', 'deep']);
export type OutputProfile = z.infer<typeof OutputProfileSchema>;

export interface OutputConstraints {
  readonly profile: OutputProfile;
  readonly maxFindings?: number;
  readonly maxOutputTokens?: number;
  readonly deltaOnly?: boolean;
}

export const DEFAULT_PROFILES: Readonly<Record<string, OutputProfile>> = {
  'recursive-worker': 'brief',
  subagent: 'brief',
  operator: 'standard',
  'top-level': 'standard',
  audit: 'deep',
  export: 'deep',
};

export function getDefaultProfile(actorType: string): OutputProfile {
  return DEFAULT_PROFILES[actorType] ?? 'standard';
}

export function applyOutputConstraints<T>(
  items: readonly T[],
  constraints: Readonly<OutputConstraints>,
): T[] {
  if (constraints.maxFindings !== undefined) {
    return items.slice(0, constraints.maxFindings);
  }
  return [...items];
}
