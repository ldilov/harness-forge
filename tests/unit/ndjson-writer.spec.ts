import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { appendNdjson } from '../../src/infrastructure/events/ndjson-writer.js';

describe('appendNdjson', () => {
  const tempDirs: string[] = [];

  function makeTempDir(): string {
    const dir = mkdtempSync(join(tmpdir(), 'ndjson-writer-'));
    tempDirs.push(dir);
    return dir;
  }

  afterEach(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  it('appends valid JSON line with newline', async () => {
    const dir = makeTempDir();
    const filePath = join(dir, 'test.ndjson');
    const data = { eventId: 'evt_1', message: 'hello' };

    await appendNdjson(filePath, data);

    const content = await readFile(filePath, 'utf-8');
    expect(content).toBe(JSON.stringify(data) + '\n');
    expect(() => JSON.parse(content.trim())).not.toThrow();
  });

  it('creates parent directory if missing', async () => {
    const dir = makeTempDir();
    const filePath = join(dir, 'nested', 'deep', 'test.ndjson');
    const data = { key: 'value' };

    await appendNdjson(filePath, data);

    const content = await readFile(filePath, 'utf-8');
    expect(content).toBe(JSON.stringify(data) + '\n');
  });

  it('multiple appends produce multiple parseable lines', async () => {
    const dir = makeTempDir();
    const filePath = join(dir, 'multi.ndjson');
    const items = [
      { id: 1, name: 'first' },
      { id: 2, name: 'second' },
      { id: 3, name: 'third' },
    ];

    for (const item of items) {
      await appendNdjson(filePath, item);
    }

    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim().length > 0);
    expect(lines).toHaveLength(3);

    const parsed = lines.map((line) => JSON.parse(line));
    expect(parsed).toEqual(items);
  });

  it('handles objects with special characters', async () => {
    const dir = makeTempDir();
    const filePath = join(dir, 'special.ndjson');
    const data = {
      message: 'line\nbreak',
      path: 'C:\\Users\\test',
      emoji: '\u{1F600}',
      quotes: '"hello"',
      unicode: '\u00e9\u00e8\u00ea',
    };

    await appendNdjson(filePath, data);

    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim().length > 0);
    expect(lines).toHaveLength(1);

    const parsed = JSON.parse(lines[0]!);
    expect(parsed).toEqual(data);
  });
});
