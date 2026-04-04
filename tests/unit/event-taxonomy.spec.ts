import { describe, it, expect } from 'vitest';

import { EventTypes, DEFAULT_IMPORTANCE } from '../../src/domain/observability/events/event-taxonomy.js';

describe('EventTypes', () => {
  it('contains at least 10 event types', () => {
    const count = Object.keys(EventTypes).length;
    expect(count).toBeGreaterThanOrEqual(10);
  });

  it('all event type values follow dot-notation format', () => {
    for (const value of Object.values(EventTypes)) {
      expect(value).toMatch(/^[a-z]+\.[a-z]+$/);
    }
  });
});

describe('DEFAULT_IMPORTANCE', () => {
  it('has an entry for every event type value', () => {
    for (const eventType of Object.values(EventTypes)) {
      expect(DEFAULT_IMPORTANCE).toHaveProperty(eventType);
    }
  });

  it('all importance values are valid levels', () => {
    const validLevels = new Set(['critical', 'high', 'medium', 'low', 'trace']);
    for (const importance of Object.values(DEFAULT_IMPORTANCE)) {
      expect(validLevels.has(importance)).toBe(true);
    }
  });
});
