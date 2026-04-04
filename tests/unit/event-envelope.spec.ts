import { describe, it, expect } from 'vitest';

import { EventEnvelopeSchema } from '../../src/domain/observability/events/event-envelope.js';

describe('EventEnvelopeSchema', () => {
  const validEnvelope = {
    eventId: 'evt_abc123',
    eventType: 'task.started',
    occurredAt: '2025-01-01T00:00:00Z',
    schemaVersion: '1.0.0',
    runtimeSessionId: 'rsn_xyz789',
    payload: { detail: 'test' },
  };

  it('validates a complete event envelope', () => {
    const result = EventEnvelopeSchema.safeParse(validEnvelope);
    expect(result.success).toBe(true);
  });

  it('rejects an envelope missing eventId', () => {
    const { eventId: _, ...incomplete } = validEnvelope;
    const result = EventEnvelopeSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
  });

  it('rejects an envelope missing payload', () => {
    const { payload: _, ...incomplete } = validEnvelope;
    const result = EventEnvelopeSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
  });

  it('rejects an envelope missing runtimeSessionId', () => {
    const { runtimeSessionId: _, ...incomplete } = validEnvelope;
    const result = EventEnvelopeSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
  });
});
