/**
 * Resolves the output profile for a given execution context.
 * Implements AC-6: Output Profile Defaulting.
 */
export type OutputProfile = 'brief' | 'standard' | 'deep';

export type ExecutionContext =
  | 'top_level'
  | 'subagent'
  | 'recursive_worker'
  | 'review_export';

export interface ProfileResolution {
  readonly profile: OutputProfile;
  readonly source: 'default' | 'explicit_override';
  readonly context: ExecutionContext;
}

export class OutputProfileResolver {
  private static readonly DEFAULTS: Readonly<Record<ExecutionContext, OutputProfile>> = {
    top_level: 'standard',
    subagent: 'brief',
    recursive_worker: 'brief',
    review_export: 'deep',
  } as const;

  resolve(context: ExecutionContext, explicitOverride?: OutputProfile): ProfileResolution {
    if (explicitOverride) {
      return {
        profile: explicitOverride,
        source: 'explicit_override',
        context,
      };
    }

    return {
      profile: OutputProfileResolver.DEFAULTS[context],
      source: 'default',
      context,
    };
  }
}
