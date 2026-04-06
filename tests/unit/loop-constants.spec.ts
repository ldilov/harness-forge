import { describe, it, expect } from 'vitest';
import { generateId } from '@shared/id-generator.js';
import {
  RUNTIME_TRACES_DIR,
  RUNTIME_INSIGHTS_DIR,
  RUNTIME_EFFECTIVENESS_LEDGER_FILE,
  RUNTIME_PATTERNS_FILE,
  RUNTIME_TUNING_LOG_FILE,
  RUNTIME_MERGE_LOG_FILE,
  RUNTIME_INSIGHTS_CHANGELOG_FILE,
  RUNTIME_INSIGHTS_RECOMMENDATIONS_FILE,
  LOOP_PATTERN_EXTRACT_INTERVAL,
  LOOP_CONFIDENCE_OBSERVE,
  LOOP_CONFIDENCE_SUGGEST,
  LOOP_ROLLBACK_WINDOW,
  BUNDLE_FILE_EXTENSION,
} from '@shared/constants.js';

describe('Loop constants', () => {
  it('trace directory is under runtime', () => {
    expect(RUNTIME_TRACES_DIR).toBe('traces');
  });

  it('insights directory is under runtime', () => {
    expect(RUNTIME_INSIGHTS_DIR).toBe('insights');
  });

  it('ledger file uses ndjson format', () => {
    expect(RUNTIME_EFFECTIVENESS_LEDGER_FILE).toMatch(/\.ndjson$/);
  });

  it('patterns file uses json format', () => {
    expect(RUNTIME_PATTERNS_FILE).toMatch(/\.json$/);
  });

  it('bundle extension starts with dot', () => {
    expect(BUNDLE_FILE_EXTENSION).toBe('.hfb');
  });

  it('extract interval is positive integer', () => {
    expect(LOOP_PATTERN_EXTRACT_INTERVAL).toBeGreaterThan(0);
    expect(Number.isInteger(LOOP_PATTERN_EXTRACT_INTERVAL)).toBe(true);
  });

  it('confidence thresholds are ordered', () => {
    expect(LOOP_CONFIDENCE_OBSERVE).toBeLessThan(LOOP_CONFIDENCE_SUGGEST);
  });

  it('rollback window is positive', () => {
    expect(LOOP_ROLLBACK_WINDOW).toBeGreaterThan(0);
  });
});

describe('Loop ID prefixes', () => {
  it('generates trace IDs with trc_ prefix', () => {
    const id = generateId('trace');
    expect(id).toMatch(/^trc_[a-f0-9]{24}$/);
  });

  it('generates pattern IDs with pat_ prefix', () => {
    const id = generateId('pattern');
    expect(id).toMatch(/^pat_[a-f0-9]{24}$/);
  });

  it('generates tuning IDs with tun_ prefix', () => {
    const id = generateId('tuning');
    expect(id).toMatch(/^tun_[a-f0-9]{24}$/);
  });

  it('generates bundle IDs with bnd_ prefix', () => {
    const id = generateId('bundle');
    expect(id).toMatch(/^bnd_[a-f0-9]{24}$/);
  });

  it('all generated IDs are unique', () => {
    const ids = new Set([
      generateId('trace'),
      generateId('trace'),
      generateId('pattern'),
      generateId('tuning'),
      generateId('bundle'),
    ]);
    expect(ids.size).toBe(5);
  });
});
