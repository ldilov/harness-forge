import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CompactionArtifactUpdater } from '../../src/application/behavior/compaction-artifact-updater.js';
import { StartupFileGenerator } from '../../src/application/behavior/startup-file-generator.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hforge-compact-'));
  // Generate baseline files
  const gen = new StartupFileGenerator(tmpDir);
  await gen.generate();
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('CompactionArtifactUpdater', () => {
  it('creates delta-summary.json after compaction', async () => {
    const updater = new CompactionArtifactUpdater(tmpDir);
    const result = await updater.updateAfterCompaction({
      compactionLevel: 'trim',
      tokensBefore: 5000,
      tokensAfter: 3000,
      removedSections: ['dead-end exploration'],
    });

    expect(result.updatedFiles.length).toBeGreaterThanOrEqual(2);
    const deltaPath = path.join(tmpDir, '.hforge/runtime/context/delta-summary.json');
    const raw = await fs.readFile(deltaPath, 'utf8');
    const parsed = JSON.parse(raw);
    expect(parsed.lastCompactionLevel).toBe('trim');
    expect(parsed.tokensBefore).toBe(5000);
    expect(parsed.tokensAfter).toBe(3000);
  });

  it('creates compaction-manifest.json after compaction', async () => {
    const updater = new CompactionArtifactUpdater(tmpDir);
    await updater.updateAfterCompaction({
      compactionLevel: 'summarize',
      tokensBefore: 8000,
      tokensAfter: 2000,
      removedSections: ['tool output dump', 'large code block'],
    });

    const manifestPath = path.join(tmpDir, '.hforge/runtime/context/compaction-manifest.json');
    const raw = await fs.readFile(manifestPath, 'utf8');
    const parsed = JSON.parse(raw);
    expect(parsed.lastCompaction.level).toBe('summarize');
    expect(parsed.lastCompaction.removedSections).toContain('tool output dump');
  });

  it('reports current memory word count', async () => {
    const updater = new CompactionArtifactUpdater(tmpDir);
    const result = await updater.updateAfterCompaction({
      compactionLevel: 'trim',
      tokensBefore: 100,
      tokensAfter: 80,
      removedSections: [],
    });

    expect(result.memoryWordCount).toBeGreaterThan(0);
    expect(result.estimatedTokens).toBeGreaterThan(0);
  });
});
