import { describe, it, expect } from 'vitest';

import { aggregateCostByTaskId } from '../../src/application/compaction/cost-aggregator.js';
import type { EventEnvelope } from '../../src/domain/observability/events/event-envelope.js';

function makeEvent(taskId: string, cost: { durationMs?: number; tokensUsed?: number; apiCalls?: number }): EventEnvelope {
  return {
    eventId: 'evt_1',
    eventType: 'task.completed',
    occurredAt: '2025-01-01T00:00:00Z',
    schemaVersion: '1.0.0',
    runtimeSessionId: 'rsn_1',
    taskId,
    cost,
    payload: {},
  };
}

describe('aggregateCostByTaskId', () => {
  it('sums costs for events with the same taskId', () => {
    const events = [
      makeEvent('t1', { durationMs: 100, tokensUsed: 50, apiCalls: 1 }),
      makeEvent('t1', { durationMs: 200, tokensUsed: 30, apiCalls: 2 }),
    ];
    const result = aggregateCostByTaskId(events);
    const t1 = result.get('t1')!;
    expect(t1.durationMs).toBe(300);
    expect(t1.tokensUsed).toBe(80);
    expect(t1.apiCalls).toBe(3);
    expect(t1.eventCount).toBe(2);
  });

  it('separates costs by different taskIds', () => {
    const events = [
      makeEvent('t1', { tokensUsed: 10 }),
      makeEvent('t2', { tokensUsed: 20 }),
    ];
    const result = aggregateCostByTaskId(events);
    expect(result.size).toBe(2);
    expect(result.get('t1')!.tokensUsed).toBe(10);
    expect(result.get('t2')!.tokensUsed).toBe(20);
  });

  it('skips events without a taskId', () => {
    const events: EventEnvelope[] = [{
      eventId: 'evt_1',
      eventType: 'metric.recorded',
      occurredAt: '2025-01-01T00:00:00Z',
      schemaVersion: '1.0.0',
      runtimeSessionId: 'rsn_1',
      cost: { tokensUsed: 100 },
      payload: {},
    }];
    const result = aggregateCostByTaskId(events);
    expect(result.size).toBe(0);
  });
});
