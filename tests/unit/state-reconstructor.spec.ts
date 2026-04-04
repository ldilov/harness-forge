import { describe, expect, it } from 'vitest';

import { reconstructState } from '../../src/application/events/replay/state-reconstructor.js';
import type { EventEnvelope } from '../../src/domain/observability/events/event-envelope.js';

function makeEvent(overrides: Partial<EventEnvelope> & { eventId: string }): EventEnvelope {
  return {
    eventType: 'test.event',
    occurredAt: new Date().toISOString(),
    schemaVersion: '1.0.0',
    runtimeSessionId: 'session-1',
    payload: {},
    ...overrides,
  };
}

describe('reconstructState', () => {
  it('reconstructs categories from events', () => {
    const events: EventEnvelope[] = [
      makeEvent({ eventId: 'e1', category: 'task', occurredAt: '2025-01-01T00:00:00Z' }),
      makeEvent({ eventId: 'e2', category: 'artifact', occurredAt: '2025-01-01T00:01:00Z' }),
      makeEvent({ eventId: 'e3', category: 'task', occurredAt: '2025-01-01T00:02:00Z' }),
    ];

    const state = reconstructState(events);

    expect(state.eventCount).toBe(3);
    expect(state.categories).toEqual(['artifact', 'task']); // sorted
  });

  it('reconstructs taskIds from events', () => {
    const events: EventEnvelope[] = [
      makeEvent({ eventId: 'e1', taskId: 'task-B', occurredAt: '2025-01-01T00:00:00Z' }),
      makeEvent({ eventId: 'e2', taskId: 'task-A', occurredAt: '2025-01-01T00:01:00Z' }),
      makeEvent({ eventId: 'e3', taskId: 'task-B', occurredAt: '2025-01-01T00:02:00Z' }),
    ];

    const state = reconstructState(events);

    expect(state.taskIds).toEqual(['task-A', 'task-B']); // sorted, deduplicated
  });

  it('calculates importance counts from events', () => {
    const events: EventEnvelope[] = [
      makeEvent({ eventId: 'e1', importance: 'critical', occurredAt: '2025-01-01T00:00:00Z' }),
      makeEvent({ eventId: 'e2', importance: 'low', occurredAt: '2025-01-01T00:01:00Z' }),
      makeEvent({ eventId: 'e3', importance: 'critical', occurredAt: '2025-01-01T00:02:00Z' }),
      makeEvent({ eventId: 'e4', occurredAt: '2025-01-01T00:03:00Z' }),
    ];

    const state = reconstructState(events);

    expect(state.importanceCounts['critical']).toBe(2);
    expect(state.importanceCounts['low']).toBe(1);
    expect(state.importanceCounts['unspecified']).toBe(1);
  });

  it('computes time range from sorted events', () => {
    const events: EventEnvelope[] = [
      makeEvent({ eventId: 'e1', occurredAt: '2025-03-15T10:00:00Z' }),
      makeEvent({ eventId: 'e2', occurredAt: '2025-03-15T08:00:00Z' }),
      makeEvent({ eventId: 'e3', occurredAt: '2025-03-15T12:00:00Z' }),
    ];

    const state = reconstructState(events);

    expect(state.timeRange).not.toBeNull();
    expect(state.timeRange!.first).toBe('2025-03-15T08:00:00Z');
    expect(state.timeRange!.last).toBe('2025-03-15T12:00:00Z');
  });

  it('returns empty state for zero events', () => {
    const state = reconstructState([]);

    expect(state.eventCount).toBe(0);
    expect(state.categories).toEqual([]);
    expect(state.taskIds).toEqual([]);
    expect(state.timeRange).toBeNull();
    expect(state.importanceCounts).toEqual({});
  });
});
