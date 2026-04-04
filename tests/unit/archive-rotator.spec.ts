import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { rotateArchive } from '../../src/infrastructure/events/archive-rotator.js';

describe('rotateArchive', () => {
  const tempDirs: string[] = [];

  function makeTempDir(): string {
    const dir = mkdtempSync(join(tmpdir(), 'archive-rotator-'));
    tempDirs.push(dir);
    return dir;
  }

  afterEach(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  it('rotates current.ndjson to archive/YYYY-MM-DD.ndjson', async () => {
    const dir = makeTempDir();
    const currentPath = join(dir, 'current.ndjson');
    const eventLine = JSON.stringify({ eventId: 'evt_1', eventType: 'test' }) + '\n';
    await writeFile(currentPath, eventLine, 'utf-8');

    const archivePath = await rotateArchive(dir);

    expect(archivePath).not.toBeNull();
    expect(archivePath!).toMatch(/archive[/\\]\d{4}-\d{2}-\d{2}(|-\d+)\.ndjson$/);

    const archived = await readFile(archivePath!, 'utf-8');
    expect(archived).toBe(eventLine);
  });

  it('creates fresh empty current.ndjson after rotation', async () => {
    const dir = makeTempDir();
    const currentPath = join(dir, 'current.ndjson');
    await writeFile(currentPath, '{"eventId":"evt_1"}\n', 'utf-8');

    await rotateArchive(dir);

    const content = await readFile(currentPath, 'utf-8');
    expect(content).toBe('');
  });

  it('returns null when current.ndjson does not exist', async () => {
    const dir = makeTempDir();

    const result = await rotateArchive(dir);

    expect(result).toBeNull();
  });

  it('returns null when current.ndjson is empty', async () => {
    const dir = makeTempDir();
    const currentPath = join(dir, 'current.ndjson');
    await writeFile(currentPath, '', 'utf-8');

    const result = await rotateArchive(dir);

    expect(result).toBeNull();
  });
});
