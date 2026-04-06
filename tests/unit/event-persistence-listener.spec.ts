import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createPersistenceListener } from '@app/behavior/event-persistence-listener.js';
import { BehaviorEventEmitter } from '@app/behavior/behavior-event-emitter.js';

describe('createPersistenceListener', () => {
  let tmpDir: string;
  let eventsPath: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hforge-test-'));
    eventsPath = path.join(tmpDir, '.hforge', 'observability', 'events.json');
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('creates file and appends first event', async () => {
    const listener = createPersistenceListener(eventsPath);
    const emitter = new BehaviorEventEmitter('test-session');
    emitter.onEvent(listener);
    emitter.emitCommandStarted({ command: 'install' });
    await new Promise((r) => setTimeout(r, 100));
    const content = await fs.readFile(eventsPath, 'utf8');
    const events = JSON.parse(content) as unknown[];
    expect(events).toHaveLength(1);
    expect((events[0] as Record<string, unknown>).eventType).toBe('command.started');
  });

  it('appends multiple events to existing array', async () => {
    const listener = createPersistenceListener(eventsPath);
    const emitter = new BehaviorEventEmitter('test-session');
    emitter.onEvent(listener);
    emitter.emitCommandStarted({ command: 'install' });
    emitter.emitCommandCompleted({ command: 'install', durationMs: 100 });
    await new Promise((r) => setTimeout(r, 200));
    const content = await fs.readFile(eventsPath, 'utf8');
    const events = JSON.parse(content) as unknown[];
    expect(events).toHaveLength(2);
  });

  it('accepts a function that resolves the path lazily', async () => {
    const listener = createPersistenceListener(() => eventsPath);
    const emitter = new BehaviorEventEmitter('test-session');
    emitter.onEvent(listener);
    emitter.emitCommandStarted({ command: 'install' });
    await new Promise((r) => setTimeout(r, 100));
    const content = await fs.readFile(eventsPath, 'utf8');
    const events = JSON.parse(content) as unknown[];
    expect(events).toHaveLength(1);
    expect((events[0] as Record<string, unknown>).eventType).toBe('command.started');
  });

  it('follows path changes when given a function resolver', async () => {
    const altEventsPath = path.join(tmpDir, 'alt-dir', 'events.json');
    let currentPath = eventsPath;
    const listener = createPersistenceListener(() => currentPath);
    const emitter = new BehaviorEventEmitter('test-session');
    emitter.onEvent(listener);

    emitter.emitCommandStarted({ command: 'first' });
    await new Promise((r) => setTimeout(r, 100));

    // Switch path mid-session
    currentPath = altEventsPath;
    emitter.emitCommandCompleted({ command: 'second', durationMs: 50 });
    await new Promise((r) => setTimeout(r, 100));

    const firstContent = await fs.readFile(eventsPath, 'utf8');
    const firstEvents = JSON.parse(firstContent) as unknown[];
    expect(firstEvents).toHaveLength(1);

    const altContent = await fs.readFile(altEventsPath, 'utf8');
    const altEvents = JSON.parse(altContent) as unknown[];
    expect(altEvents).toHaveLength(1);
  });

  it('appends to pre-existing events file', async () => {
    await fs.mkdir(path.dirname(eventsPath), { recursive: true });
    await fs.writeFile(eventsPath, JSON.stringify([{ existing: true }]), 'utf8');
    const listener = createPersistenceListener(eventsPath);
    const emitter = new BehaviorEventEmitter('test-session');
    emitter.onEvent(listener);
    emitter.emitSessionStarted({ version: '1.0.0' });
    await new Promise((r) => setTimeout(r, 100));
    const content = await fs.readFile(eventsPath, 'utf8');
    const events = JSON.parse(content) as unknown[];
    expect(events).toHaveLength(2);
    expect((events[0] as Record<string, unknown>).existing).toBe(true);
  });
});
