import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { rotateMemory } from '../../src/application/compaction/memory/memory-rotator.js';
import { SIZE_BUDGET } from '../../src/domain/compaction/memory/memory-content-rules.js';

describe('rotateMemory', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hforge-rotator-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('triggers rotation when memory.md exceeds the token cap', async () => {
    const memoryPath = path.join(tmpDir, 'MEMORY.md');
    const charBudget = SIZE_BUDGET.hardCapTokens * SIZE_BUDGET.charsPerToken;

    // Build a large markdown that exceeds the budget
    const bigObjective = 'Implement feature ' + 'x'.repeat(charBudget);
    const content = [
      '# Session Memory',
      '',
      '## Current Objective',
      bigObjective,
      '',
      '## Current State',
      '- step one done',
      '',
      '## Accepted Decisions',
      '- use approach A',
      '',
      '## Constraints',
      '- none',
      '',
      '## Open Questions / Blockers',
      '- blocked on review',
      '',
      '## Next Best Actions',
      '- continue work',
      '',
      '## Canonical References',
      '- docs/spec.md',
    ].join('\n');

    await fs.writeFile(memoryPath, content, 'utf-8');

    const runtimePath = path.join(tmpDir, 'runtime');
    const result = await rotateMemory(tmpDir, runtimePath);

    expect(result.archived).toBe(true);
    expect(result.archivePath).toBeDefined();
    expect(typeof result.archivePath).toBe('string');
  });

  it('produces a memory.md that trims state and decisions after rotation', async () => {
    const memoryPath = path.join(tmpDir, 'MEMORY.md');
    const charBudget = SIZE_BUDGET.hardCapTokens * SIZE_BUDGET.charsPerToken;

    // Create many state and decision items so trimming is visible
    const manyStates = Array.from({ length: 20 }, (_, i) => `- state item ${i} ${'z'.repeat(200)}`);
    const manyDecisions = Array.from({ length: 20 }, (_, i) => `- decision ${i} ${'w'.repeat(200)}`);

    const content = [
      '# Session Memory',
      '',
      '## Current Objective',
      'Implement the feature',
      '',
      '## Current State',
      ...manyStates,
      '',
      '## Accepted Decisions',
      ...manyDecisions,
      '',
      '## Constraints',
      '',
      '## Open Questions / Blockers',
      '- blocker 1',
      '',
      '## Next Best Actions',
      '- action 1',
      '',
      '## Canonical References',
      '- ref 1',
    ].join('\n');

    // Pad extra to exceed budget
    const paddedContent = content + '\n' + 'x'.repeat(charBudget);
    await fs.writeFile(memoryPath, paddedContent, 'utf-8');

    const runtimePath = path.join(tmpDir, 'runtime');
    await rotateMemory(tmpDir, runtimePath);

    // After rotation, state is trimmed to last 3 and decisions to last 5
    const rotated = await fs.readFile(memoryPath, 'utf-8');
    const stateMatches = rotated.match(/^- state item \d+/gm) ?? [];
    const decisionMatches = rotated.match(/^- decision \d+/gm) ?? [];

    expect(stateMatches.length).toBeLessThanOrEqual(3);
    expect(decisionMatches.length).toBeLessThanOrEqual(5);
  });

  it('returns { archived: false } when content is within budget', async () => {
    const memoryPath = path.join(tmpDir, 'MEMORY.md');
    const smallContent = [
      '# Session Memory',
      '',
      '## Current Objective',
      'Small task',
      '',
      '## Current State',
      '- done',
    ].join('\n');

    await fs.writeFile(memoryPath, smallContent, 'utf-8');

    const runtimePath = path.join(tmpDir, 'runtime');
    const result = await rotateMemory(tmpDir, runtimePath);

    expect(result.archived).toBe(false);
    expect(result.archivePath).toBeUndefined();
  });

  it('returns { archived: false } when memory.md does not exist', async () => {
    const runtimePath = path.join(tmpDir, 'runtime');
    const result = await rotateMemory(tmpDir, runtimePath);

    expect(result.archived).toBe(false);
  });
});
