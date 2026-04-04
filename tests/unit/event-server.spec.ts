import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { EventServer } from '../../src/application/behavior/event-server.js';

let tmpDir: string;
let server: EventServer;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hforge-evt-'));
  // Create observability directory with sample events
  const obsDir = path.join(tmpDir, '.hforge', 'observability');
  await fs.mkdir(obsDir, { recursive: true });
  await fs.writeFile(
    path.join(obsDir, 'events.json'),
    JSON.stringify([
      { eventId: 'evt-1', eventType: 'context.compaction.triggered', runtimeSessionId: 'sess-1' },
      { eventId: 'evt-2', eventType: 'context.budget.warning', runtimeSessionId: 'sess-1' },
    ]),
    'utf8',
  );
  // Create budget file
  const runtimeDir = path.join(tmpDir, '.hforge', 'runtime');
  await fs.mkdir(runtimeDir, { recursive: true });
  await fs.writeFile(
    path.join(runtimeDir, 'context-budget.json'),
    JSON.stringify({ schemaVersion: '1.0.0', current: { estimatedInputTokens: 5000 } }),
    'utf8',
  );

  server = new EventServer({ workspaceRoot: tmpDir, port: 0 });
});

afterEach(async () => {
  await server.stop();
  await fs.rm(tmpDir, { recursive: true, force: true });
});

function fetchJson(url: string): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode ?? 500, body: JSON.parse(data) });
      });
    }).on('error', reject);
  });
}

describe('EventServer', () => {
  it('/health returns 200 with ok status', async () => {
    // Use a random port to avoid conflicts
    server = new EventServer({ workspaceRoot: tmpDir, port: 14571 });
    await server.start();
    const { status, body } = await fetchJson(`${server.address}/health`);
    expect(status).toBe(200);
    expect((body as Record<string, unknown>).status).toBe('ok');
  });

  it('/events returns JSON array of events', async () => {
    server = new EventServer({ workspaceRoot: tmpDir, port: 14572 });
    await server.start();
    const { status, body } = await fetchJson(`${server.address}/events`);
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect((body as unknown[]).length).toBe(2);
  });

  it('/events/stream returns SSE headers', async () => {
    server = new EventServer({ workspaceRoot: tmpDir, port: 14573 });
    await server.start();
    return new Promise<void>((resolve) => {
      http.get(`${server.address}/events/stream`, (res) => {
        expect(res.headers['content-type']).toBe('text/event-stream');
        res.destroy();
        resolve();
      });
    });
  });

  it('/budgets returns budget state', async () => {
    server = new EventServer({ workspaceRoot: tmpDir, port: 14574 });
    await server.start();
    const { status, body } = await fetchJson(`${server.address}/budgets`);
    expect(status).toBe(200);
    expect((body as Record<string, unknown>).schemaVersion).toBe('1.0.0');
  });

  it('/compactions returns only compaction events', async () => {
    server = new EventServer({ workspaceRoot: tmpDir, port: 14575 });
    await server.start();
    const { status, body } = await fetchJson(`${server.address}/compactions`);
    expect(status).toBe(200);
    expect((body as unknown[]).length).toBe(1);
  });

  it('binds to localhost only', async () => {
    server = new EventServer({ workspaceRoot: tmpDir, port: 14576 });
    await server.start();
    expect(server.address).toContain('127.0.0.1');
  });
});
