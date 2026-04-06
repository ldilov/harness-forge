import { describe, expect, it } from 'vitest';
import { BEHAVIOR_EVENT_TYPES } from '@domain/behavior/behavior-event-types.js';

describe('BEHAVIOR_EVENT_TYPES contract', () => {
  const allValues = Object.values(BEHAVIOR_EVENT_TYPES);
  const allKeys = Object.keys(BEHAVIOR_EVENT_TYPES);

  it('contains exactly 43 event type constants', () => {
    expect(allKeys).toHaveLength(43);
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

  describe('discovery category (3 events)', () => {
    const discoveryKeys = [
      'WORKSPACE_DISCOVERY_COMPLETED',
      'WORKSPACE_DIAGNOSIS_COMPLETED',
      'RECOMMENDATION_GENERATED',
    ] as const;

    it('has all 3 discovery event types', () => {
      for (const key of discoveryKeys) {
        expect(BEHAVIOR_EVENT_TYPES).toHaveProperty(key);
      }
    });

    it('discovery event values follow dotted naming convention', () => {
      for (const key of discoveryKeys) {
        const value = BEHAVIOR_EVENT_TYPES[key];
        expect(value).toMatch(/^(workspace|recommendation)\.\w+(\.\w+)?$/);
      }
    });
  });

  describe('install category (4 events)', () => {
    const installKeys = [
      'INSTALL_PLAN_CREATED',
      'INSTALL_OPERATION_APPLIED',
      'INSTALL_COMPLETED',
      'INSTALL_VALIDATION_COMPLETED',
    ] as const;

    it('has all 4 install event types', () => {
      for (const key of installKeys) {
        expect(BEHAVIOR_EVENT_TYPES).toHaveProperty(key);
      }
    });

    it('install event values are prefixed with install.', () => {
      for (const key of installKeys) {
        const value = BEHAVIOR_EVENT_TYPES[key];
        expect(value).toMatch(/^install\.\w+(\.\w+)?$/);
      }
    });
  });

  describe('compaction extension category (3 events)', () => {
    const compactionExtKeys = [
      'COMPACTION_STRATEGY_SELECTED',
      'COMPACTION_VALIDATION_COMPLETED',
      'MEMORY_ROTATION_FAILED',
    ] as const;

    it('has all 3 compaction extension event types', () => {
      for (const key of compactionExtKeys) {
        expect(BEHAVIOR_EVENT_TYPES).toHaveProperty(key);
      }
    });
  });

  describe('command lifecycle category (3 events)', () => {
    const commandKeys = [
      'COMMAND_STARTED',
      'COMMAND_COMPLETED',
      'COMMAND_FAILED',
    ] as const;

    it('has all 3 command lifecycle event types', () => {
      for (const key of commandKeys) {
        expect(BEHAVIOR_EVENT_TYPES).toHaveProperty(key);
      }
    });

    it('command event values are prefixed with command.', () => {
      for (const key of commandKeys) {
        const value = BEHAVIOR_EVENT_TYPES[key];
        expect(value).toMatch(/^command\.\w+$/);
      }
    });
  });

  describe('session lifecycle category (2 events)', () => {
    const sessionKeys = [
      'SESSION_STARTED',
      'SESSION_ENDED',
    ] as const;

    it('has all 2 session lifecycle event types', () => {
      for (const key of sessionKeys) {
        expect(BEHAVIOR_EVENT_TYPES).toHaveProperty(key);
      }
    });

    it('session event values are prefixed with session.', () => {
      for (const key of sessionKeys) {
        const value = BEHAVIOR_EVENT_TYPES[key];
        expect(value).toMatch(/^session\.\w+$/);
      }
    });
  });

  describe('loop category (6 events)', () => {
    const loopKeys = [
      'LOOP_TRACE_RECORDED',
      'LOOP_PATTERN_EXTRACTED',
      'LOOP_TUNING_APPLIED',
      'LOOP_TUNING_REVERTED',
      'LOOP_BUNDLE_EXPORTED',
      'LOOP_BUNDLE_IMPORTED',
    ] as const;

    it('has all 6 loop event types', () => {
      for (const key of loopKeys) {
        expect(BEHAVIOR_EVENT_TYPES).toHaveProperty(key);
      }
    });

    it('loop event values are prefixed with loop.', () => {
      for (const key of loopKeys) {
        const value = BEHAVIOR_EVENT_TYPES[key];
        expect(value).toMatch(/^loop\.\w+\.\w+$/);
      }
    });
  });

  it('category counts sum to total (8 + 5 + 5 + 1 + 1 + 2 + 3 + 4 + 3 + 3 + 2 + 6 = 43)', () => {
    expect(8 + 5 + 5 + 1 + 1 + 2 + 3 + 4 + 3 + 3 + 2 + 6).toBe(allKeys.length);
  });
});
