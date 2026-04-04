import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { EventEmitter } from '../../src/infrastructure/events/event-emitter.js';
import { EventEnvelopeSchema } from '../../src/domain/observability/events/event-envelope.js';

describe('EventEmitter', () => {
  const tempDirs: string[] = [];

  function makeTempDir(): string {
    const dir = mkdtempSync(join(tmpdir(), 'event-emitter-'));
    tempDirs.push(dir);
    return dir;
  }

  afterEach(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  it('emit() assigns eventId and occurredAt', async () => {
    const dir = makeTempDir();
    const emitter = new EventEmitter(dir);

    const result = await emitter.emit({
      eventType: 'task.started',
      payload: { detail: 'test' },
    });

    expect(result.eventId).toMatch(/^evt_/);
    expect(result.occurredAt).toBeTruthy();
    expect(new Date(result.occurredAt).toISOString()).toBe(result.occurredAt);
  });

  it('emit() assigns schemaVersion 1.0.0', async () => {
    const dir = makeTempDir();
    const emitter = new EventEmitter(dir);

    const result = await emitter.emit({
      eventType: 'task.completed',
      payload: {},
    });

    expect(result.schemaVersion).toBe('1.0.0');
  });

  it('emit() writes to current.ndjson', async () => {
    const dir = makeTempDir();
    const emitter = new EventEmitter(dir);

    await emitter.emit({
      eventType: 'task.started',
      payload: { info: 'written' },
    });

    const filePath = join(dir, 'current.ndjson');
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim().length > 0);
    expect(lines).toHaveLength(1);

    const parsed = JSON.parse(lines[0]!);
    expect(parsed.eventType).toBe('task.started');
    expect(parsed.payload).toEqual({ info: 'written' });
  });

  it('emit() validates against EventEnvelopeSchema', async () => {
    const dir = makeTempDir();
    const emitter = new EventEmitter(dir);

    const result = await emitter.emit({
      eventType: 'metric.recorded',
      payload: { value: 42 },
    });

    const validation = EventEnvelopeSchema.safeParse(result);
    expect(validation.success).toBe(true);
  });

  it('emitted event is readable from NDJSON file', async () => {
    const dir = makeTempDir();
    const emitter = new EventEmitter(dir);

    const emitted = await emitter.emit({
      eventType: 'file.created',
      payload: { path: '/tmp/test.txt' },
      taskId: 'task_abc',
    });

    const filePath = join(dir, 'current.ndjson');
    const content = await readFile(filePath, 'utf-8');
    const parsed = JSON.parse(content.trim());

    expect(parsed.eventId).toBe(emitted.eventId);
    expect(parsed.eventType).toBe('file.created');
    expect(parsed.taskId).toBe('task_abc');
  });

  it('ensures directory creation on first use', async () => {
    const dir = makeTempDir();
    const nestedPath = join(dir, 'deep', 'nested', 'events');
    const emitter = new EventEmitter(nestedPath);

    const result = await emitter.emit({
      eventType: 'task.started',
      payload: {},
    });

    expect(result.eventId).toMatch(/^evt_/);

    const filePath = join(nestedPath, 'current.ndjson');
    const content = await readFile(filePath, 'utf-8');
    expect(content.trim().length).toBeGreaterThan(0);
  });
});
