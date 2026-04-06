import type { BehaviorEvent } from '@app/behavior/behavior-event-emitter.js';

export type SignalType = 'event' | 'metric' | 'state' | 'replay';

export interface SignalMessage {
  readonly type: SignalType;
  readonly channel: string;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly timestamp: string;
  readonly sequenceId: number;
}

export interface MetricSnapshot {
  readonly name: string;
  readonly value: number;
  readonly unit: string;
  readonly window: string;
  readonly timestamp: string;
}

export type EnforcementLevelId = 'guidance' | 'defaults' | 'nudge' | 'enforcement';
export type CompactionLevelId = 'none' | 'trim' | 'summarize' | 'rollup' | 'rollover';

export interface BudgetThresholds {
  readonly evaluateAt: number;
  readonly trimAt: number;
  readonly summarizeAt: number;
  readonly rollupAt: number;
  readonly rolloverAt: number;
}

export interface RuntimeStateSnapshot {
  readonly enforcement: EnforcementLevelId;
  readonly compaction: CompactionLevelId;
  readonly memoryTokens: number;
  readonly budgetPercent: number;
  readonly budgetThresholds: BudgetThresholds;
}

export interface SystemInitPayload {
  readonly version: string;
  readonly sessionId: string;
  readonly totalEvents: number;
  readonly currentBudget: Readonly<Record<string, unknown>> | null;
  readonly currentEnforcement: EnforcementLevelId;
  readonly currentCompactionLevel: CompactionLevelId;
  readonly memoryTokens: number;
  readonly budgetThresholds: BudgetThresholds;
}

export interface HeartbeatPayload {
  readonly uptime: number;
  readonly totalEvents: number;
  readonly state: RuntimeStateSnapshot;
}

export type SignalAggregation = 'none' | 'counter' | 'rate' | 'gauge';

export interface SignalChannelDefinition {
  readonly name: string;
  readonly category: string;
  readonly sourceEventTypes: readonly string[];
  readonly aggregation: SignalAggregation;
}

export type EventListener = (event: BehaviorEvent) => void;
