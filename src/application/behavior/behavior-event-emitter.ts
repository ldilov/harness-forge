import { randomBytes } from 'node:crypto';
import {
  BEHAVIOR_EVENT_TYPES,
  type BehaviorEventType,
} from '@domain/behavior/behavior-event-types.js';

export interface BehaviorEventPayload {
  readonly budgetState?: { readonly estimatedTokens: number; readonly hardCap: number };
  readonly tokensBeforeAfter?: { readonly before: number; readonly after: number };
  readonly suppressionCounts?: { readonly total: number; readonly suppressed: number };
  readonly automatic?: boolean;
  readonly [key: string]: unknown;
}

export interface BehaviorEvent {
  readonly eventId: string;
  readonly eventType: BehaviorEventType;
  readonly occurredAt: string;
  readonly schemaVersion: string;
  readonly runtimeSessionId: string;
  readonly taskId?: string;
  readonly correlationId?: string;
  readonly payload: BehaviorEventPayload;
}

function generateEventId(): string {
  return `bevt_${randomBytes(12).toString('hex')}`;
}

const SCHEMA_VERSION = '1.0.0';

export class BehaviorEventEmitter {
  private readonly runtimeSessionId: string;

  constructor(runtimeSessionId: string) {
    this.runtimeSessionId = runtimeSessionId;
  }

  private buildEvent(
    eventType: BehaviorEventType,
    payload: BehaviorEventPayload,
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return {
      eventId: generateEventId(),
      eventType,
      occurredAt: new Date().toISOString(),
      schemaVersion: SCHEMA_VERSION,
      runtimeSessionId: this.runtimeSessionId,
      ...(options?.taskId !== undefined ? { taskId: options.taskId } : {}),
      ...(options?.correlationId !== undefined ? { correlationId: options.correlationId } : {}),
      payload,
    };
  }

  emitContextLoad(
    payload: BehaviorEventPayload = {},
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.CONTEXT_LOAD_COMPLETED, payload, options);
  }

  emitCompaction(
    payload: BehaviorEventPayload & { readonly tokensBeforeAfter: { readonly before: number; readonly after: number } },
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.CONTEXT_COMPACTION_COMPLETED, payload, options);
  }

  emitBudgetWarning(
    payload: BehaviorEventPayload & { readonly budgetState: { readonly estimatedTokens: number; readonly hardCap: number } },
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.CONTEXT_BUDGET_WARNING, payload, options);
  }

  emitBudgetExceeded(
    payload: BehaviorEventPayload & { readonly budgetState: { readonly estimatedTokens: number; readonly hardCap: number } },
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.CONTEXT_BUDGET_EXCEEDED, payload, options);
  }

  emitHistoryExpansion(
    payload: BehaviorEventPayload = {},
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.HISTORY_EXPANSION_REQUESTED, payload, options);
  }

  emitDuplicateSuppressed(
    payload: BehaviorEventPayload & { readonly suppressionCounts: { readonly total: number; readonly suppressed: number } },
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.CONTEXT_DUPLICATE_SUPPRESSED, payload, options);
  }

  emitSubagentBrief(
    payload: BehaviorEventPayload = {},
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.SUBAGENT_BRIEF_GENERATED, payload, options);
  }

  emitResponseProfile(
    payload: BehaviorEventPayload = {},
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.RESPONSE_PROFILE_SELECTED, payload, options);
  }

  emitMemoryRotation(
    payload: BehaviorEventPayload & { readonly automatic?: boolean } = {},
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.MEMORY_ROTATION_COMPLETED, payload, options);
  }

  emitContextSummary(
    payload: BehaviorEventPayload = {},
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.CONTEXT_SUMMARY_PROMOTED, payload, options);
  }

  emitContextDelta(
    payload: BehaviorEventPayload = {},
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.CONTEXT_DELTA_EMITTED, payload, options);
  }

  emitSubagentRun(
    payload: BehaviorEventPayload = {},
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.SUBAGENT_RUN_COMPLETED, payload, options);
  }
}
