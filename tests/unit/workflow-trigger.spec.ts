import { describe, expect, it } from 'vitest';

import { shouldTriggerAfterWorkflow } from '../../src/application/compaction/triggers/workflow-trigger.js';

describe('shouldTriggerAfterWorkflow', () => {
  it.each([
    'task.completed',
    'review.completed',
    'export.completed',
    'recursive.run.completed',
    'bridge.generated',
  ])('returns true for %s', (eventType) => {
    expect(shouldTriggerAfterWorkflow(eventType)).toBe(true);
  });

  it.each([
    'task.started',
    'review.started',
    'export.started',
    'file.changed',
    'session.started',
    'unknown.event',
    '',
  ])('returns false for %s', (eventType) => {
    expect(shouldTriggerAfterWorkflow(eventType)).toBe(false);
  });
});
