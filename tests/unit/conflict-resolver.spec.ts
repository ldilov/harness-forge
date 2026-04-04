import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { resolveConflicts } from '../../src/application/compaction/memory/conflict-resolver.js';
import type { MemorySessionSummary } from '../../src/domain/compaction/memory/memory-session-summary.js';
import type { ActiveContext } from '../../src/domain/compaction/active-context.js';

describe('resolveConflicts', () => {
  let tmpDir: string;

  const baseMemory: MemorySessionSummary = {
    objective: 'Build auth module',
    state: ['scaffolded'],
    decisions: ['use JWT'],
    constraints: ['SSO required'],
    blockers: ['awaiting API keys'],
    nextActions: ['implement login endpoint'],
    references: ['docs/auth.md'],
  };

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hforge-conflict-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  async function writeActiveContext(data: ActiveContext): Promise<void> {
    const contextPath = path.join(tmpDir, 'active-context.json');
    await fs.mkdir(path.dirname(contextPath), { recursive: true });
    await fs.writeFile(contextPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  it('detects objective mismatch between memory and runtime', async () => {
    await writeActiveContext({
      schemaVersion: '1.0.0',
      objective: 'Build payment module',
      acceptedPlan: [],
      latestDeltaRef: 'delta-1',
      sessionSummaryRef: 'summary-1',
      targetPosture: {},
      unresolved: [],
    });

    const result = await resolveConflicts(baseMemory, tmpDir);

    expect(result.conflicts.length).toBeGreaterThan(0);
    expect(result.conflicts.some((c) => c.includes('Objective mismatch'))).toBe(true);
  });

  it('resolves conflict by using runtime artifact values for objective', async () => {
    await writeActiveContext({
      schemaVersion: '1.0.0',
      objective: 'Build payment module',
      acceptedPlan: [],
      latestDeltaRef: 'delta-1',
      sessionSummaryRef: 'summary-1',
      targetPosture: {},
      unresolved: [],
    });

    const result = await resolveConflicts(baseMemory, tmpDir);

    // The resolved objective should come from the runtime context
    expect(result.resolved.objective).toBe('Build payment module');
  });

  it('resolves plan mismatch using runtime acceptedPlan', async () => {
    await writeActiveContext({
      schemaVersion: '1.0.0',
      objective: 'Build auth module',
      acceptedPlan: ['step A', 'step B'],
      latestDeltaRef: 'delta-1',
      sessionSummaryRef: 'summary-1',
      targetPosture: {},
      unresolved: [],
    });

    const result = await resolveConflicts(baseMemory, tmpDir);

    expect(result.conflicts.some((c) => c.includes('Plan mismatch'))).toBe(true);
    expect(result.resolved.nextActions).toEqual(['step A', 'step B']);
  });

  it('adds unresolved items from runtime that are not in memory blockers', async () => {
    await writeActiveContext({
      schemaVersion: '1.0.0',
      objective: 'Build auth module',
      acceptedPlan: [],
      latestDeltaRef: 'delta-1',
      sessionSummaryRef: 'summary-1',
      targetPosture: {},
      unresolved: ['new blocker from runtime'],
    });

    const result = await resolveConflicts(baseMemory, tmpDir);

    expect(result.conflicts.some((c) => c.includes('Unresolved item from runtime'))).toBe(true);
    expect(result.resolved.blockers).toContain('new blocker from runtime');
    expect(result.resolved.blockers).toContain('awaiting API keys');
  });

  it('returns empty conflicts array when no mismatch exists', async () => {
    await writeActiveContext({
      schemaVersion: '1.0.0',
      objective: 'Build auth module',
      acceptedPlan: [],
      latestDeltaRef: 'delta-1',
      sessionSummaryRef: 'summary-1',
      targetPosture: {},
      unresolved: [],
    });

    const result = await resolveConflicts(baseMemory, tmpDir);

    expect(result.conflicts).toEqual([]);
    expect(result.resolved.objective).toBe('Build auth module');
  });

  it('returns no conflicts when active-context.json does not exist', async () => {
    const result = await resolveConflicts(baseMemory, tmpDir);

    expect(result.conflicts).toEqual([]);
    expect(result.resolved).toEqual(baseMemory);
  });
});
