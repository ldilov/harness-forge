import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { archiveMemory } from '../../src/application/compaction/memory/memory-archiver.js';
import { MemoryArchiveSchema } from '../../src/domain/compaction/memory/memory-archive.js';
import type { MemorySessionSummary } from '../../src/domain/compaction/memory/memory-session-summary.js';

describe('archiveMemory', () => {
  let tmpDir: string;

  const sampleSummary: MemorySessionSummary = {
    objective: 'Build login feature',
    state: ['scaffolded auth module'],
    decisions: ['use JWT tokens'],
    constraints: ['must support SSO'],
    blockers: [],
    nextActions: ['implement token refresh'],
    references: ['docs/auth-spec.md'],
  };

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hforge-archiver-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('creates an archive file inside memory-history directory', async () => {
    const archivePath = await archiveMemory(sampleSummary, tmpDir);

    expect(archivePath).toContain('memory-history');
    expect(archivePath.endsWith('.json')).toBe(true);

    const stat = await fs.stat(archivePath);
    expect(stat.isFile()).toBe(true);
  });

  it('validates the archive file content against MemoryArchiveSchema', async () => {
    const archivePath = await archiveMemory(sampleSummary, tmpDir);
    const raw = await fs.readFile(archivePath, 'utf-8');
    const parsed = JSON.parse(raw);

    const result = MemoryArchiveSchema.safeParse(parsed);
    expect(result.success).toBe(true);
    expect(result.data?.objective).toBe('Build login feature');
    expect(result.data?.archivedAt).toBeDefined();
  });

  it('returns the archive file path', async () => {
    const archivePath = await archiveMemory(sampleSummary, tmpDir);

    expect(typeof archivePath).toBe('string');
    expect(archivePath.length).toBeGreaterThan(0);

    // The path should be inside the base path
    const relative = path.relative(tmpDir, archivePath);
    expect(relative.startsWith('..')).toBe(false);
  });
});
