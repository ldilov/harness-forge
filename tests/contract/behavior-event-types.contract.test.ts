import { describe, expect, it } from 'vitest';
import { BEHAVIOR_EVENT_TYPES } from '@domain/behavior/behavior-event-types.js';

describe('BEHAVIOR_EVENT_TYPES contract', () => {
  const allValues = Object.values(BEHAVIOR_EVENT_TYPES);
  const allKeys = Object.keys(BEHAVIOR_EVENT_TYPES);

  it('contains exactly 22 event type constants', () => {
    expect(allKeys).toHaveLength(22);
  });

  it('all values are unique strings', () => {
    const uniqueValues = new Set(allValues);
    expect(uniqueValues.size).toBe(allValues.length);
    for (const value of allValues) {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    }
  });

  describe('memory category (8 events)', () => {
    const memoryKeys = [
      'CONTEXT_LOAD_STARTED',
      'CONTEXT_LOAD_COMPLETED',
      'CONTEXT_COMPACTION_TRIGGERED',
      'CONTEXT_COMPACTION_COMPLETED',
      'CONTEXT_SUMMARY_PROMOTED',
      'CONTEXT_DELTA_EMITTED',
      'MEMORY_ROTATION_STARTED',
      'MEMORY_ROTATION_COMPLETED',
    ] as const;

    it('has all 8 memory event types', () => {
      for (const key of memoryKeys) {
        expect(BEHAVIOR_EVENT_TYPES).toHaveProperty(key);
      }
    });

    it('memory event values follow dotted naming convention', () => {
      for (const key of memoryKeys) {
        const value = BEHAVIOR_EVENT_TYPES[key];
        expect(value).toMatch(/^(context|memory)\.\w+\.\w+$/);
      }
    });
  });

  describe('budget category (5 events)', () => {
    const budgetKeys = [
      'CONTEXT_BUDGET_WARNING',
      'CONTEXT_BUDGET_EXCEEDED',
      'HISTORY_EXPANSION_REQUESTED',
      'HISTORY_EXPANSION_DENIED',
      'CONTEXT_DUPLICATE_SUPPRESSED',
    ] as const;

    it('has all 5 budget event types', () => {
      for (const key of budgetKeys) {
        expect(BEHAVIOR_EVENT_TYPES).toHaveProperty(key);
      }
    });

    it('budget event values follow dotted naming convention', () => {
      for (const key of budgetKeys) {
        const value = BEHAVIOR_EVENT_TYPES[key];
        expect(value).toMatch(/^(context|history)\.\w+\.\w+$/);
      }
    });
  });

  describe('subagent category (5 events)', () => {
    const subagentKeys = [
      'SUBAGENT_BRIEF_GENERATED',
      'SUBAGENT_BRIEF_REWRITTEN',
      'SUBAGENT_BRIEF_REJECTED',
      'SUBAGENT_RUN_STARTED',
      'SUBAGENT_RUN_COMPLETED',
    ] as const;

    it('has all 5 subagent event types', () => {
      for (const key of subagentKeys) {
        expect(BEHAVIOR_EVENT_TYPES).toHaveProperty(key);
      }
    });

    it('subagent event values are prefixed with subagent.', () => {
      for (const key of subagentKeys) {
        const value = BEHAVIOR_EVENT_TYPES[key];
        expect(value).toMatch(/^subagent\.\w+\.\w+$/);
      }
    });
  });

  describe('output category (2 events)', () => {
    const outputKeys = [
      'RESPONSE_PROFILE_SELECTED',
      'RESPONSE_PROFILE_OVERRIDDEN',
    ] as const;

    it('has all 2 output event types', () => {
      for (const key of outputKeys) {
        expect(BEHAVIOR_EVENT_TYPES).toHaveProperty(key);
      }
    });

    it('output event values are prefixed with response.', () => {
      for (const key of outputKeys) {
        const value = BEHAVIOR_EVENT_TYPES[key];
        expect(value).toMatch(/^response\.\w+\.\w+$/);
      }
    });
  });

  describe('artifact promotion category (1 event)', () => {
    it('has artifact pointer promoted event', () => {
      expect(BEHAVIOR_EVENT_TYPES).toHaveProperty('ARTIFACT_POINTER_PROMOTED');
    });
  });

  describe('startup category (1 event)', () => {
    it('has runtime startup files generated event', () => {
      expect(BEHAVIOR_EVENT_TYPES).toHaveProperty('RUNTIME_STARTUP_FILES_GENERATED');
    });
  });

  it('category counts sum to total (8 + 5 + 5 + 1 + 1 + 2 = 22)', () => {
    expect(8 + 5 + 5 + 1 + 1 + 2).toBe(allKeys.length);
  });
});
