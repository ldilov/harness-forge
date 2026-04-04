import { describe, expect, it } from 'vitest';

import {
  HistoryExpansionGate,
  type ExpansionRequest,
} from '../../src/application/behavior/history-expansion-gate.js';
import { type HistoryExpansionPolicy } from '../../src/domain/behavior/history-expansion-policy.js';

const denyPolicy: HistoryExpansionPolicy = {
  schemaVersion: '1.0.0',
  defaultAction: 'deny',
  overrideConditions: [
    'explicit_user_request',
    'task_policy_exemption',
    'recovery_debug_mode',
  ],
  eventOnDenial: true,
};

const allowPolicy: HistoryExpansionPolicy = {
  ...denyPolicy,
  defaultAction: 'allow',
};

describe('HistoryExpansionGate', () => {
  it('denies expansion when no override is provided and default is deny', () => {
    const gate = new HistoryExpansionGate(denyPolicy);
    const request: ExpansionRequest = { reason: 'need more context' };

    const result = gate.evaluate(request);

    expect(result.allowed).toBe(false);
    expect(result.eventType).toBe('history.expansion.denied');
    expect(result.reason).toContain('Denied');
    expect(result.reason).toContain('need more context');
  });

  it('allows expansion with explicit_user_request override', () => {
    const gate = new HistoryExpansionGate(denyPolicy);
    const request: ExpansionRequest = {
      reason: 'user asked',
      overrideFlag: 'explicit_user_request',
    };

    const result = gate.evaluate(request);

    expect(result.allowed).toBe(true);
    expect(result.eventType).toBe('history.expansion.requested');
    expect(result.reason).toBe('Override: explicit_user_request');
  });

  it('allows expansion with task_policy_exemption override', () => {
    const gate = new HistoryExpansionGate(denyPolicy);
    const request: ExpansionRequest = {
      reason: 'task requires it',
      overrideFlag: 'task_policy_exemption',
    };

    const result = gate.evaluate(request);

    expect(result.allowed).toBe(true);
    expect(result.eventType).toBe('history.expansion.requested');
    expect(result.reason).toBe('Override: task_policy_exemption');
  });

  it('allows expansion with recovery_debug_mode override', () => {
    const gate = new HistoryExpansionGate(denyPolicy);
    const request: ExpansionRequest = {
      reason: 'debugging',
      overrideFlag: 'recovery_debug_mode',
    };

    const result = gate.evaluate(request);

    expect(result.allowed).toBe(true);
    expect(result.eventType).toBe('history.expansion.requested');
    expect(result.reason).toBe('Override: recovery_debug_mode');
  });

  it('allows expansion when default policy is allow and no override given', () => {
    const gate = new HistoryExpansionGate(allowPolicy);
    const request: ExpansionRequest = { reason: 'general expansion' };

    const result = gate.evaluate(request);

    expect(result.allowed).toBe(true);
    expect(result.eventType).toBe('history.expansion.requested');
    expect(result.reason).toBe('Default policy: allow');
  });
});
