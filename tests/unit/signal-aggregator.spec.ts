import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SignalAggregator, type SignalSink } from '../../src/application/dashboard/signal-aggregator.js';
import type { BehaviorEvent } from '../../src/application/behavior/behavior-event-emitter.js';
import type { SignalMessage } from '../../src/domain/dashboard/signal-types.js';

function makeEvent(overrides: Partial<BehaviorEvent> = {}): BehaviorEvent {
  return {
    eventId: 'bevt_test123',
    eventType: 'context.compaction.completed',
    occurredAt: new Date().toISOString(),
    schemaVersion: '1.0.0',
    runtimeSessionId: 'sess_test',
    payload: {},
    ...overrides,
  };
}

describe('SignalAggregator', () => {
  let sent: SignalMessage[];
  let sink: SignalSink;
  let aggregator: SignalAggregator;

  beforeEach(() => {
    sent = [];
    sink = { send: (s: SignalMessage) => sent.push(s) };
    aggregator = new SignalAggregator(sink);
  });

  it('routes a compaction event to compaction.activity and compaction.stats channels', () => {
    aggregator.handleEvent(makeEvent({ eventType: 'context.compaction.completed' }));
    const channels = sent.filter((s) => s.type === 'event').map((s) => s.channel);
    expect(channels).toContain('compaction.activity');
    expect(channels).toContain('compaction.stats');
  });

  it('routes every event to events.all channel', () => {
    aggregator.handleEvent(makeEvent({ eventType: 'subagent.brief.generated' }));
    const allChannel = sent.filter((s) => s.type === 'event' && s.channel === 'events.all');
    expect(allChannel.length).toBeGreaterThanOrEqual(1);
  });

  it('assigns monotonically increasing sequenceIds', () => {
    aggregator.handleEvent(makeEvent());
    aggregator.handleEvent(makeEvent());
    const ids = sent.map((s) => s.sequenceId);
    for (let i = 1; i < ids.length; i++) {
      expect(ids[i]).toBeGreaterThan(ids[i - 1]!);
    }
  });

  it('tracks event counts by type', () => {
    aggregator.handleEvent(makeEvent({ eventType: 'context.budget.warning' }));
    aggregator.handleEvent(makeEvent({ eventType: 'context.budget.warning' }));
    aggregator.handleEvent(makeEvent({ eventType: 'memory.rotation.completed' }));
    const counts = aggregator.getEventCounts();
    expect(counts.get('context.budget.warning')).toBe(2);
    expect(counts.get('memory.rotation.completed')).toBe(1);
  });

  it('computes total events', () => {
    aggregator.handleEvent(makeEvent());
    aggregator.handleEvent(makeEvent());
    aggregator.handleEvent(makeEvent());
    expect(aggregator.getTotalEvents()).toBe(3);
  });

  it('emits budget metric when budgetState is in payload', () => {
    aggregator.handleEvent(
      makeEvent({
        payload: { budgetState: { estimatedTokens: 3000, hardCap: 4000 } },
      }),
    );
    const budgetMetrics = sent.filter(
      (s) => s.type === 'metric' && (s.payload as Record<string, unknown>).name === 'budget.usage.percent',
    );
    expect(budgetMetrics.length).toBe(1);
    expect((budgetMetrics[0]!.payload as Record<string, unknown>).value).toBe(75);
  });

  it('emits compaction token metrics when tokensBeforeAfter is in payload', () => {
    aggregator.handleEvent(
      makeEvent({
        payload: { tokensBeforeAfter: { before: 3800, after: 2100 } },
      }),
    );
    const savedMetric = sent.find(
      (s) => s.type === 'metric' && (s.payload as Record<string, unknown>).name === 'compaction.tokens.saved',
    );
    expect(savedMetric).toBeDefined();
    expect((savedMetric!.payload as Record<string, unknown>).value).toBe(1700);
  });

  it('emits suppression ratio metric', () => {
    aggregator.handleEvent(
      makeEvent({
        eventType: 'context.duplicate.suppressed',
        payload: { suppressionCounts: { total: 10, suppressed: 3 } },
      }),
    );
    const ratioMetric = sent.find(
      (s) => s.type === 'metric' && (s.payload as Record<string, unknown>).name === 'suppression.ratio',
    );
    expect(ratioMetric).toBeDefined();
    expect((ratioMetric!.payload as Record<string, unknown>).value).toBe(30);
  });

  it('replays events with type=replay', () => {
    aggregator.replayEvent(makeEvent());
    const replays = sent.filter((s) => s.type === 'replay');
    expect(replays.length).toBeGreaterThanOrEqual(1);
  });
});
