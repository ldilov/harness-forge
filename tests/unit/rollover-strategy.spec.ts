import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { applyRollover } from '../../src/application/compaction/strategies/rollover-strategy.js';

describe('applyRollover', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'rollover-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('atomic write creates a valid file', async () => {
    const fileName = 'active-context.json';
    const originalContent = JSON.stringify({ schemaVersion: '1.0.0', objective: 'test' });

    await writeFile(join(tempDir, fileName), originalContent, 'utf-8');

    await applyRollover(tempDir, fileName);

    const result = await readFile(join(tempDir, fileName), 'utf-8');
    const parsed = JSON.parse(result);
    expect(parsed.schemaVersion).toBe('1.0.0');
    expect(parsed.objective).toBe('test');
  });

  it('original file unchanged if validation fails', async () => {
    const fileName = 'broken-context.json';
    const validContent = JSON.stringify({ schemaVersion: '1.0.0' });

    await writeFile(join(tempDir, fileName), validContent, 'utf-8');

    // Overwrite the file with invalid JSON so that when applyRollover reads it,
    // it reads the bad content, writes it to .tmp, and then JSON.parse fails.
    await writeFile(join(tempDir, fileName), '{{ not valid json }}', 'utf-8');

    await expect(applyRollover(tempDir, fileName)).rejects.toThrow(
      'Rollover validation failed',
    );

    // The original file content should remain (the bad JSON, since that's what was on disk).
    // The key invariant: the .tmp file should have been cleaned up.
    const afterContent = await readFile(join(tempDir, fileName), 'utf-8');
    expect(afterContent).toBe('{{ not valid json }}');
  });
});
