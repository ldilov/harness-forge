import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { StartupFileGenerator } from '../../src/application/behavior/startup-file-generator.js';
import { StartupFileRefresher } from '../../src/application/behavior/startup-file-refresher.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hforge-refresh-'));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('StartupFileRefresher', () => {
  it('preserves operator-edited MEMORY.md', async () => {
    // First generate defaults
    const gen = new StartupFileGenerator(tmpDir);
    await gen.generate();

    // Operator edits MEMORY.md
    const memoryPath = path.join(tmpDir, 'MEMORY.md');
    await fs.writeFile(memoryPath, '# Custom Memory\n\nOperator content here.\n', 'utf8');

    // Refresh
    const refresher = new StartupFileRefresher(tmpDir);
    const report = await refresher.refresh();

    // Verify MEMORY.md was preserved
    expect(report.preserved).toContain('MEMORY.md');
    const content = await fs.readFile(memoryPath, 'utf8');
    expect(content).toContain('Operator content here.');
  });

  it('restores missing MEMORY.md', async () => {
    // No prior generation — MEMORY.md does not exist
    const refresher = new StartupFileRefresher(tmpDir);
    const report = await refresher.refresh();

    expect(report.restored).toContain('MEMORY.md');
    const memoryPath = path.join(tmpDir, 'MEMORY.md');
    const content = await fs.readFile(memoryPath, 'utf8');
    expect(content).toContain('## Current Objective');
  });

  it('regenerates JSON policy files deterministically', async () => {
    const gen = new StartupFileGenerator(tmpDir);
    await gen.generate();

    // Corrupt a JSON file
    const loadOrderPath = path.join(tmpDir, '.hforge/runtime/load-order.json');
    await fs.writeFile(loadOrderPath, '{"corrupted": true}', 'utf8');

    // Refresh
    const refresher = new StartupFileRefresher(tmpDir);
    const report = await refresher.refresh();

    expect(report.regenerated.length).toBeGreaterThan(0);
    const raw = await fs.readFile(loadOrderPath, 'utf8');
    const parsed = JSON.parse(raw);
    expect(parsed.conflictPolicy).toBe('runtime_wins');
  });

  it('restores missing session-summary.json', async () => {
    // Generate then delete session-summary
    const gen = new StartupFileGenerator(tmpDir);
    await gen.generate();
    await fs.rm(path.join(tmpDir, '.hforge/runtime/session-summary.json'));

    const refresher = new StartupFileRefresher(tmpDir);
    const report = await refresher.refresh();

    expect(report.restored.length).toBeGreaterThan(0);
    const stat = await fs.stat(path.join(tmpDir, '.hforge/runtime/session-summary.json'));
    expect(stat.isFile()).toBe(true);
  });
});
