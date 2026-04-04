import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { EventEnvelopeSchema } from '../../src/domain/observability/events/event-envelope.js';
import { ContextBudgetSchema } from '../../src/domain/compaction/context-budget.js';
import { CompactionManifestSchema } from '../../src/domain/compaction/compaction-manifest.js';
import { SessionSummarySchema } from '../../src/domain/compaction/session-summary.js';
import { DeltaSummarySchema } from '../../src/domain/compaction/delta-summary.js';
import { TurnImportanceSchema } from '../../src/domain/compaction/turn-importance.js';
import { ActiveContextSchema } from '../../src/domain/compaction/active-context.js';
import { MemorySessionSummarySchema } from '../../src/domain/compaction/memory/memory-session-summary.js';

const root = process.cwd();

function loadFixture(relativePath: string): unknown {
  const raw = readFileSync(path.join(root, relativePath), 'utf8');
  return JSON.parse(raw);
}

describe('schema validation — event and compaction fixtures', () => {
  it('event envelope example validates', () => {
    const fixture = loadFixture('tests/fixtures/events/event-envelope-example.json');
    const result = EventEnvelopeSchema.safeParse(fixture);
    expect(result.success, JSON.stringify(result.error?.issues ?? [])).toBe(true);
  });

  it('context budget example validates', () => {
    const fixture = loadFixture('tests/fixtures/compaction/context-budget-example.json');
    const result = ContextBudgetSchema.safeParse(fixture);
    expect(result.success, JSON.stringify(result.error?.issues ?? [])).toBe(true);
  });

  it('compaction manifest example validates', () => {
    const fixture = loadFixture('tests/fixtures/compaction/compaction-manifest-example.json');
    const result = CompactionManifestSchema.safeParse(fixture);
    expect(result.success, JSON.stringify(result.error?.issues ?? [])).toBe(true);
  });

  it('session summary example validates', () => {
    const fixture = loadFixture('tests/fixtures/compaction/session-summary-example.json');
    const result = SessionSummarySchema.safeParse(fixture);
    expect(result.success, JSON.stringify(result.error?.issues ?? [])).toBe(true);
  });

  it('delta summary example validates', () => {
    const fixture = loadFixture('tests/fixtures/compaction/delta-summary-example.json');
    const result = DeltaSummarySchema.safeParse(fixture);
    expect(result.success, JSON.stringify(result.error?.issues ?? [])).toBe(true);
  });

  it('turn importance example validates', () => {
    const fixture = loadFixture('tests/fixtures/compaction/turn-importance-example.json');
    const result = TurnImportanceSchema.safeParse(fixture);
    expect(result.success, JSON.stringify(result.error?.issues ?? [])).toBe(true);
  });

  it('active context example validates', () => {
    const fixture = loadFixture('tests/fixtures/compaction/active-context-example.json');
    const result = ActiveContextSchema.safeParse(fixture);
    expect(result.success, JSON.stringify(result.error?.issues ?? [])).toBe(true);
  });

  it('memory state example validates', () => {
    const fixture = loadFixture('tests/fixtures/compaction/memory-state-example.json');
    const result = MemorySessionSummarySchema.safeParse(fixture);
    expect(result.success, JSON.stringify(result.error?.issues ?? [])).toBe(true);
  });
});
