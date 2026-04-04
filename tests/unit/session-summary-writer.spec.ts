import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { writeSessionSummary } from '../../src/application/compaction/memory/session-summary-writer.js';
import { MemorySessionSummarySchema } from '../../src/domain/compaction/memory/memory-session-summary.js';

describe('writeSessionSummary', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hforge-summary-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('writes a valid JSON file at basePath/memory-state.json', async () => {
    const data = {
      objective: 'Deploy to production',
      state: ['tests passing'],
      decisions: ['use blue-green deploy'],
      constraints: ['zero downtime'],
      blockers: [],
      nextActions: ['run deploy script'],
      references: ['runbook.md'],
    };

    await writeSessionSummary(tmpDir, data);

    const outputPath = path.join(tmpDir, 'memory-state.json');
    const stat = await fs.stat(outputPath);
    expect(stat.isFile()).toBe(true);

    const raw = await fs.readFile(outputPath, 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.objective).toBe('Deploy to production');
    expect(parsed.state).toEqual(['tests passing']);
  });

  it('validates data against MemorySessionSummarySchema before writing', async () => {
    const validData = {
      objective: 'Test validation',
      state: ['ok'],
      decisions: [],
      constraints: [],
      blockers: [],
      nextActions: [],
      references: [],
    };

    await writeSessionSummary(tmpDir, validData);

    const outputPath = path.join(tmpDir, 'memory-state.json');
    const raw = await fs.readFile(outputPath, 'utf-8');
    const parsed = JSON.parse(raw);

    // The written file should also pass schema validation
    const result = MemorySessionSummarySchema.safeParse(parsed);
    expect(result.success).toBe(true);
  });

  it('throws when data is invalid according to the schema', async () => {
    const invalidData = {
      objective: 123, // should be string
      state: 'not-an-array',
    } as unknown as Parameters<typeof writeSessionSummary>[1];

    await expect(writeSessionSummary(tmpDir, invalidData)).rejects.toThrow();
  });
});
