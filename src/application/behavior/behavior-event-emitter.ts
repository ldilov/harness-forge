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

export type BehaviorEventListener = (event: BehaviorEvent) => void;

export class BehaviorEventEmitter {
  private readonly runtimeSessionId: string;
  private readonly listeners: BehaviorEventListener[] = [];

  constructor(runtimeSessionId: string) {
    this.runtimeSessionId = runtimeSessionId;
  }

  onEvent(listener: BehaviorEventListener): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx >= 0) {
        this.listeners.splice(idx, 1);
      }
    };
  }

  private notifyListeners(event: BehaviorEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  private buildEvent(
    eventType: BehaviorEventType,
    payload: BehaviorEventPayload,
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    const event: BehaviorEvent = {
      eventId: generateEventId(),
      eventType,
      occurredAt: new Date().toISOString(),
      schemaVersion: SCHEMA_VERSION,
      runtimeSessionId: this.runtimeSessionId,
      ...(options?.taskId !== undefined ? { taskId: options.taskId } : {}),
      ...(options?.correlationId !== undefined ? { correlationId: options.correlationId } : {}),
      payload,
    };
    this.notifyListeners(event);
    return event;
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

  emitContextLoadStarted(
    payload: BehaviorEventPayload = {},
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.CONTEXT_LOAD_STARTED, payload, options);
  }

  emitCompactionTriggered(
    payload: BehaviorEventPayload = {},
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.CONTEXT_COMPACTION_TRIGGERED, payload, options);
  }

  emitMemoryRotationStarted(
    payload: BehaviorEventPayload = {},
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.MEMORY_ROTATION_STARTED, payload, options);
  }

  emitHistoryExpansionDenied(
    payload: BehaviorEventPayload = {},
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.HISTORY_EXPANSION_DENIED, payload, options);
  }

  emitSubagentBriefRewritten(
    payload: BehaviorEventPayload = {},
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.SUBAGENT_BRIEF_REWRITTEN, payload, options);
  }

  emitSubagentBriefRejected(
    payload: BehaviorEventPayload = {},
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.SUBAGENT_BRIEF_REJECTED, payload, options);
  }

  emitSubagentRunStarted(
    payload: BehaviorEventPayload = {},
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.SUBAGENT_RUN_STARTED, payload, options);
  }

  emitArtifactPointerPromoted(
    payload: BehaviorEventPayload = {},
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.ARTIFACT_POINTER_PROMOTED, payload, options);
  }

  emitResponseProfileOverridden(
    payload: BehaviorEventPayload = {},
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.RESPONSE_PROFILE_OVERRIDDEN, payload, options);
  }

  emitStartupFilesGenerated(
    payload: BehaviorEventPayload = {},
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.RUNTIME_STARTUP_FILES_GENERATED, payload, options);
  }

  emitWorkspaceDiscoveryCompleted(
    payload: BehaviorEventPayload = {},
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.WORKSPACE_DISCOVERY_COMPLETED, payload, options);
  }

  emitWorkspaceDiagnosisCompleted(
    payload: BehaviorEventPayload = {},
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.WORKSPACE_DIAGNOSIS_COMPLETED, payload, options);
  }

  emitRecommendationGenerated(
    payload: BehaviorEventPayload = {},
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.RECOMMENDATION_GENERATED, payload, options);
  }

  emitInstallPlanCreated(
    payload: BehaviorEventPayload = {},
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.INSTALL_PLAN_CREATED, payload, options);
  }

  emitInstallOperationApplied(
    payload: BehaviorEventPayload = {},
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.INSTALL_OPERATION_APPLIED, payload, options);
  }

  emitInstallCompleted(
    payload: BehaviorEventPayload = {},
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.INSTALL_COMPLETED, payload, options);
  }

  emitInstallValidationCompleted(
    payload: BehaviorEventPayload = {},
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.INSTALL_VALIDATION_COMPLETED, payload, options);
  }

  emitCompactionStrategySelected(
    payload: BehaviorEventPayload = {},
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.COMPACTION_STRATEGY_SELECTED, payload, options);
  }

  emitCompactionValidationCompleted(
    payload: BehaviorEventPayload = {},
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.COMPACTION_VALIDATION_COMPLETED, payload, options);
  }

  emitMemoryRotationFailed(
    payload: BehaviorEventPayload = {},
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.MEMORY_ROTATION_FAILED, payload, options);
  }

  emitCommandStarted(
    payload: BehaviorEventPayload = {},
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.COMMAND_STARTED, payload, options);
  }

  emitCommandCompleted(
    payload: BehaviorEventPayload = {},
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.COMMAND_COMPLETED, payload, options);
  }

  emitCommandFailed(
    payload: BehaviorEventPayload = {},
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.COMMAND_FAILED, payload, options);
  }

  emitSessionStarted(
    payload: BehaviorEventPayload = {},
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.SESSION_STARTED, payload, options);
  }

  emitSessionEnded(
    payload: BehaviorEventPayload = {},
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.SESSION_ENDED, payload, options);
  }

  // Living Loop emit methods

  emitLoopTraceRecorded(
    payload: BehaviorEventPayload & { readonly traceId: string; readonly score: number },
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.LOOP_TRACE_RECORDED, payload, options);
  }

  emitLoopPatternExtracted(
    payload: BehaviorEventPayload & { readonly patternCount: number; readonly newPatterns: number },
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.LOOP_PATTERN_EXTRACTED, payload, options);
  }

  emitLoopTuningApplied(
    payload: BehaviorEventPayload & { readonly tuningId: string; readonly parameter: string; readonly oldValue: unknown; readonly newValue: unknown },
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.LOOP_TUNING_APPLIED, payload, options);
  }

  emitLoopTuningReverted(
    payload: BehaviorEventPayload & { readonly tuningId: string; readonly parameter: string },
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.LOOP_TUNING_REVERTED, payload, options);
  }

  emitLoopBundleExported(
    payload: BehaviorEventPayload & { readonly bundleId: string; readonly outputPath: string },
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.LOOP_BUNDLE_EXPORTED, payload, options);
  }

  emitLoopBundleImported(
    payload: BehaviorEventPayload & { readonly bundleId: string; readonly patternsAdded: number; readonly patternsUpdated: number },
    options?: { readonly taskId?: string; readonly correlationId?: string },
  ): BehaviorEvent {
    return this.buildEvent(BEHAVIOR_EVENT_TYPES.LOOP_BUNDLE_IMPORTED, payload, options);
  }
}
