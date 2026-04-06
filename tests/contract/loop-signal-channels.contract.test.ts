import { describe, expect, it } from 'vitest';
import { SIGNAL_CHANNELS } from '@domain/dashboard/signal-channels.js';
import {
  LOOP_TRACE_RECORDED,
  LOOP_PATTERN_EXTRACTED,
  LOOP_TUNING_APPLIED,
  LOOP_TUNING_REVERTED,
  LOOP_BUNDLE_EXPORTED,
  LOOP_BUNDLE_IMPORTED,
} from '@domain/behavior/behavior-event-types.js';

describe('loop signal channels contract', () => {
  const loopChannels = SIGNAL_CHANNELS.filter((ch) => ch.category === 'loop');

  it('defines exactly 5 loop channels', () => {
    expect(loopChannels).toHaveLength(5);
  });

  it('has loop.observe channel sourced from LOOP_TRACE_RECORDED', () => {
    const ch = loopChannels.find((c) => c.name === 'loop.observe');
    expect(ch).toBeDefined();
    expect(ch!.sourceEventTypes).toContain(LOOP_TRACE_RECORDED);
    expect(ch!.aggregation).toBe('counter');
  });

  it('has loop.learn channel sourced from LOOP_PATTERN_EXTRACTED', () => {
    const ch = loopChannels.find((c) => c.name === 'loop.learn');
    expect(ch).toBeDefined();
    expect(ch!.sourceEventTypes).toContain(LOOP_PATTERN_EXTRACTED);
    expect(ch!.aggregation).toBe('counter');
  });

  it('has loop.adapt channel sourced from LOOP_TUNING_APPLIED and LOOP_TUNING_REVERTED', () => {
    const ch = loopChannels.find((c) => c.name === 'loop.adapt');
    expect(ch).toBeDefined();
    expect(ch!.sourceEventTypes).toContain(LOOP_TUNING_APPLIED);
    expect(ch!.sourceEventTypes).toContain(LOOP_TUNING_REVERTED);
    expect(ch!.aggregation).toBe('counter');
  });

  it('has loop.share channel sourced from LOOP_BUNDLE_EXPORTED and LOOP_BUNDLE_IMPORTED', () => {
    const ch = loopChannels.find((c) => c.name === 'loop.share');
    expect(ch).toBeDefined();
    expect(ch!.sourceEventTypes).toContain(LOOP_BUNDLE_EXPORTED);
    expect(ch!.sourceEventTypes).toContain(LOOP_BUNDLE_IMPORTED);
    expect(ch!.aggregation).toBe('counter');
  });

  it('has loop.health channel sourced from all 5 primary loop events', () => {
    const ch = loopChannels.find((c) => c.name === 'loop.health');
    expect(ch).toBeDefined();
    expect(ch!.sourceEventTypes).toContain(LOOP_TRACE_RECORDED);
    expect(ch!.sourceEventTypes).toContain(LOOP_PATTERN_EXTRACTED);
    expect(ch!.sourceEventTypes).toContain(LOOP_TUNING_APPLIED);
    expect(ch!.sourceEventTypes).toContain(LOOP_BUNDLE_EXPORTED);
    expect(ch!.sourceEventTypes).toContain(LOOP_BUNDLE_IMPORTED);
    expect(ch!.aggregation).toBe('counter');
  });

  it('all loop channels use counter aggregation', () => {
    for (const ch of loopChannels) {
      expect(ch.aggregation).toBe('counter');
    }
  });
});
