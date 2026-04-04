import { describe, expect, it } from 'vitest';
import { BehaviorEventEmitter, type BehaviorEvent } from '@app/behavior/behavior-event-emitter.js';
import { BEHAVIOR_EVENT_TYPES } from '@domain/behavior/behavior-event-types.js';

function assertRequiredFields(event: BehaviorEvent, sessionId: string): void {
  expect(event.eventId).toMatch(/^bevt_[0-9a-f]{24}$/);
  expect(event.occurredAt).toBeTruthy();
  expect(new Date(event.occurredAt).toISOString()).toBe(event.occurredAt);
  expect(event.schemaVersion).toBe('1.0.0');
  expect(event.runtimeSessionId).toBe(sessionId);
}

describe('BehaviorEventEmitter', () => {
  const SESSION_ID = 'test-session-001';

  it('emitContextLoad produces correct eventType', () => {
    const emitter = new BehaviorEventEmitter(SESSION_ID);
    const event = emitter.emitContextLoad();

    expect(event.eventType).toBe(BEHAVIOR_EVENT_TYPES.CONTEXT_LOAD_COMPLETED);
    assertRequiredFields(event, SESSION_ID);
  });

  it('emitCompaction produces correct eventType with tokensBeforeAfter', () => {
    const emitter = new BehaviorEventEmitter(SESSION_ID);
    const event = emitter.emitCompaction({
      tokensBeforeAfter: { before: 10000, after: 5000 },
    });

    expect(event.eventType).toBe(BEHAVIOR_EVENT_TYPES.CONTEXT_COMPACTION_COMPLETED);
    expect(event.payload.tokensBeforeAfter).toEqual({ before: 10000, after: 5000 });
    assertRequiredFields(event, SESSION_ID);
  });

  it('emitBudgetWarning produces correct eventType with budgetState', () => {
    const emitter = new BehaviorEventEmitter(SESSION_ID);
    const event = emitter.emitBudgetWarning({
      budgetState: { estimatedTokens: 90000, hardCap: 100000 },
    });

    expect(event.eventType).toBe(BEHAVIOR_EVENT_TYPES.CONTEXT_BUDGET_WARNING);
    expect(event.payload.budgetState).toEqual({ estimatedTokens: 90000, hardCap: 100000 });
    assertRequiredFields(event, SESSION_ID);
  });

  it('emitBudgetExceeded produces correct eventType with budgetState', () => {
    const emitter = new BehaviorEventEmitter(SESSION_ID);
    const event = emitter.emitBudgetExceeded({
      budgetState: { estimatedTokens: 110000, hardCap: 100000 },
    });

    expect(event.eventType).toBe(BEHAVIOR_EVENT_TYPES.CONTEXT_BUDGET_EXCEEDED);
    expect(event.payload.budgetState).toEqual({ estimatedTokens: 110000, hardCap: 100000 });
    assertRequiredFields(event, SESSION_ID);
  });

  it('emitDuplicateSuppressed produces correct eventType with suppressionCounts', () => {
    const emitter = new BehaviorEventEmitter(SESSION_ID);
    const event = emitter.emitDuplicateSuppressed({
      suppressionCounts: { total: 10, suppressed: 3 },
    });

    expect(event.eventType).toBe(BEHAVIOR_EVENT_TYPES.CONTEXT_DUPLICATE_SUPPRESSED);
    expect(event.payload.suppressionCounts).toEqual({ total: 10, suppressed: 3 });
    assertRequiredFields(event, SESSION_ID);
  });

  it('emitSubagentBrief produces correct eventType', () => {
    const emitter = new BehaviorEventEmitter(SESSION_ID);
    const event = emitter.emitSubagentBrief();

    expect(event.eventType).toBe(BEHAVIOR_EVENT_TYPES.SUBAGENT_BRIEF_GENERATED);
    assertRequiredFields(event, SESSION_ID);
  });

  it('emitResponseProfile produces correct eventType', () => {
    const emitter = new BehaviorEventEmitter(SESSION_ID);
    const event = emitter.emitResponseProfile();

    expect(event.eventType).toBe(BEHAVIOR_EVENT_TYPES.RESPONSE_PROFILE_SELECTED);
    assertRequiredFields(event, SESSION_ID);
  });

  it('emitHistoryExpansion produces correct eventType', () => {
    const emitter = new BehaviorEventEmitter(SESSION_ID);
    const event = emitter.emitHistoryExpansion();

    expect(event.eventType).toBe(BEHAVIOR_EVENT_TYPES.HISTORY_EXPANSION_REQUESTED);
    assertRequiredFields(event, SESSION_ID);
  });

  it('emitMemoryRotation produces correct eventType', () => {
    const emitter = new BehaviorEventEmitter(SESSION_ID);
    const event = emitter.emitMemoryRotation({ automatic: true });

    expect(event.eventType).toBe(BEHAVIOR_EVENT_TYPES.MEMORY_ROTATION_COMPLETED);
    expect(event.payload.automatic).toBe(true);
    assertRequiredFields(event, SESSION_ID);
  });

  it('emitContextSummary produces correct eventType', () => {
    const emitter = new BehaviorEventEmitter(SESSION_ID);
    const event = emitter.emitContextSummary();

    expect(event.eventType).toBe(BEHAVIOR_EVENT_TYPES.CONTEXT_SUMMARY_PROMOTED);
    assertRequiredFields(event, SESSION_ID);
  });

  it('emitContextDelta produces correct eventType', () => {
    const emitter = new BehaviorEventEmitter(SESSION_ID);
    const event = emitter.emitContextDelta();

    expect(event.eventType).toBe(BEHAVIOR_EVENT_TYPES.CONTEXT_DELTA_EMITTED);
    assertRequiredFields(event, SESSION_ID);
  });

  it('emitSubagentRun produces correct eventType', () => {
    const emitter = new BehaviorEventEmitter(SESSION_ID);
    const event = emitter.emitSubagentRun();

    expect(event.eventType).toBe(BEHAVIOR_EVENT_TYPES.SUBAGENT_RUN_COMPLETED);
    assertRequiredFields(event, SESSION_ID);
  });

  it('all events have unique eventIds', () => {
    const emitter = new BehaviorEventEmitter(SESSION_ID);
    const ids = [
      emitter.emitContextLoad().eventId,
      emitter.emitSubagentBrief().eventId,
      emitter.emitResponseProfile().eventId,
    ];
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('passes optional taskId and correlationId through', () => {
    const emitter = new BehaviorEventEmitter(SESSION_ID);
    const event = emitter.emitContextLoad({}, {
      taskId: 'task-123',
      correlationId: 'corr-456',
    });

    expect(event.taskId).toBe('task-123');
    expect(event.correlationId).toBe('corr-456');
  });

  it('omits taskId and correlationId when not provided', () => {
    const emitter = new BehaviorEventEmitter(SESSION_ID);
    const event = emitter.emitContextLoad();

    expect(event).not.toHaveProperty('taskId');
    expect(event).not.toHaveProperty('correlationId');
  });
});
