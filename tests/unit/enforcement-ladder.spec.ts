import { describe, expect, it } from 'vitest';

import {
  EnforcementLadder,
  EnforcementLevel,
} from '../../src/application/behavior/enforcement-ladder.js';

describe('EnforcementLadder', () => {
  const ladder = new EnforcementLadder();
  const hardCap = 4000;
  const targetMax = 1200;

  it('returns none at Guidance level when tokens are within budget', () => {
    const result = ladder.evaluate(500, hardCap, targetMax);

    expect(result.level).toBe(EnforcementLevel.Guidance);
    expect(result.action).toBe('none');
    expect(result.eventType).toBeUndefined();
  });

  it('returns none at Guidance level when tokens equal targetMax', () => {
    const result = ladder.evaluate(targetMax, hardCap, targetMax);

    expect(result.level).toBe(EnforcementLevel.Guidance);
    expect(result.action).toBe('none');
    expect(result.eventType).toBeUndefined();
  });

  it('returns warn at Nudge level when tokens exceed targetMax but not hardCap', () => {
    const result = ladder.evaluate(2000, hardCap, targetMax);

    expect(result.level).toBe(EnforcementLevel.Nudge);
    expect(result.action).toBe('warn');
    expect(result.eventType).toBe('context.budget.warning');
  });

  it('returns rotate at Enforcement level when tokens exceed hardCap', () => {
    const result = ladder.evaluate(5000, hardCap, targetMax);

    expect(result.level).toBe(EnforcementLevel.Enforcement);
    expect(result.action).toBe('rotate');
    expect(result.eventType).toBe('memory.rotation.started');
  });

  it('returns rotate when tokens are exactly one over hardCap', () => {
    const result = ladder.evaluate(hardCap + 1, hardCap, targetMax);

    expect(result.level).toBe(EnforcementLevel.Enforcement);
    expect(result.action).toBe('rotate');
    expect(result.eventType).toBe('memory.rotation.started');
  });

  it('returns warn when tokens are exactly one over targetMax', () => {
    const result = ladder.evaluate(targetMax + 1, hardCap, targetMax);

    expect(result.level).toBe(EnforcementLevel.Nudge);
    expect(result.action).toBe('warn');
    expect(result.eventType).toBe('context.budget.warning');
  });

  it('returns none when tokens equal hardCap (boundary not exceeded)', () => {
    const result = ladder.evaluate(hardCap, hardCap, targetMax);

    expect(result.level).toBe(EnforcementLevel.Nudge);
    expect(result.action).toBe('warn');
    expect(result.eventType).toBe('context.budget.warning');
  });
});
