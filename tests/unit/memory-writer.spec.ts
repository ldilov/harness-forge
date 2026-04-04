import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { writeMemoryMd } from '../../src/application/compaction/memory/memory-writer.js';

describe('writeMemoryMd', () => {
  let tempDir: string;

  afterEach(() => {
    if (tempDir) rmSync(tempDir, { recursive: true, force: true });
  });

  const baseData = {
    objective: 'Build the feature',
    state: ['step 1 done'],
    decisions: ['use TypeScript'],
    constraints: [],
    blockers: ['none'],
    nextActions: ['write tests'],
    references: ['src/index.ts'],
  };

  it('generates markdown with correct section headers', async () => {
    tempDir = mkdtempSync(path.join(tmpdir(), 'hf-test-'));
    const content = await writeMemoryMd(tempDir, baseData);
    expect(content).toContain('# Session Memory');
    expect(content).toContain('## Current Objective');
    expect(content).toContain('## Current State');
    expect(content).toContain('## Accepted Decisions');
    expect(content).toContain('## Next Best Actions');
  });

  it('writes memory.md file to the workspace root', async () => {
    tempDir = mkdtempSync(path.join(tmpdir(), 'hf-test-'));
    await writeMemoryMd(tempDir, baseData);
    const written = readFileSync(path.join(tempDir, 'memory.md'), 'utf-8');
    expect(written).toContain('Build the feature');
  });

  it('includes Previous Summary section when provided', async () => {
    tempDir = mkdtempSync(path.join(tmpdir(), 'hf-test-'));
    const content = await writeMemoryMd(tempDir, { ...baseData, previousSummary: 'Prior work done.' });
    expect(content).toContain('## Previous Summary');
    expect(content).toContain('Prior work done.');
  });
});
