import type { BehaviorEventEmitter } from './behavior-event-emitter.js';

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
  private readonly emitter?: BehaviorEventEmitter;

  constructor(emitter?: BehaviorEventEmitter) {
    this.emitter = emitter;
  }

  evaluate(
    memoryTokens: number,
    hardCap: number,
    targetMax: number,
  ): EnforcementAction {
    if (memoryTokens > hardCap) {
      this.emitter?.emitBudgetExceeded({
        budgetState: { estimatedTokens: memoryTokens, hardCap },
        enforcementLevel: 'enforcement',
        suggestedAction: 'rotate',
      });
      return {
        level: EnforcementLevel.Enforcement,
        action: 'rotate',
        eventType: 'memory.rotation.started',
      };
    }

    if (memoryTokens > targetMax) {
      this.emitter?.emitBudgetWarning({
        budgetState: { estimatedTokens: memoryTokens, hardCap },
        enforcementLevel: 'nudge',
        suggestedAction: 'warn',
        targetMax,
      });
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
