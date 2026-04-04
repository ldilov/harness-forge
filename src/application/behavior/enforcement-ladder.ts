export enum EnforcementLevel {
  Guidance = 1,
  Defaults = 2,
  Nudge = 3,
  Enforcement = 4,
}

export interface EnforcementAction {
  readonly level: EnforcementLevel;
  readonly action: 'none' | 'warn' | 'rotate';
  readonly eventType?: string;
}

export class EnforcementLadder {
  evaluate(
    memoryTokens: number,
    hardCap: number,
    targetMax: number,
  ): EnforcementAction {
    if (memoryTokens > hardCap) {
      return {
        level: EnforcementLevel.Enforcement,
        action: 'rotate',
        eventType: 'memory.rotation.started',
      };
    }

    if (memoryTokens > targetMax) {
      return {
        level: EnforcementLevel.Nudge,
        action: 'warn',
        eventType: 'context.budget.warning',
      };
    }

    return {
      level: EnforcementLevel.Guidance,
      action: 'none',
    };
  }
}
