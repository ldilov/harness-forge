import { describe, it, expect, afterEach } from 'vitest';
import { DashboardServer } from '../../src/application/dashboard/dashboard-server.js';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';

describe('DashboardServer', () => {
  let server: DashboardServer | null = null;
  let tmpDir: string;

  afterEach(async () => {
    if (server) {
      await server.stop();
      server = null;
    }
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  });

  async function createServer(): Promise<DashboardServer> {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hforge-dash-'));
    // Use port 0 to let the OS assign a free port — eliminates EADDRINUSE flakiness
    server = new DashboardServer({
      workspaceRoot: tmpDir,
      port: 0,
      sessionId: 'test_session',
      version: '1.0.0-test',
    });
    await server.start();
    return server;
  }

  it('starts and responds to /health', async () => {
    const srv = await createServer();
    const res = await fetch(`${srv.address}/health`);
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string };
    expect(body.status).toBe('ok');
  });

  it('returns empty events array when no events file exists', async () => {
    const srv = await createServer();
    const res = await fetch(`${srv.address}/api/events`);
    expect(res.status).toBe(200);
    const body = await res.json() as unknown[];
    expect(body).toEqual([]);
  });

  it('returns null budget when no budget file exists', async () => {
    const srv = await createServer();
    const res = await fetch(`${srv.address}/api/budget`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toBeNull();
  });

  it('serves dashboard HTML at root path', async () => {
    const srv = await createServer();
    const res = await fetch(srv.address);
    expect(res.status).toBe(200);
    const contentType = res.headers.get('content-type');
    expect(contentType).toContain('text/html');
  });

  it('returns 404 for unknown paths', async () => {
    const srv = await createServer();
    const res = await fetch(`${srv.address}/unknown`);
    expect(res.status).toBe(404);
  });

  it('stops cleanly', async () => {
    const srv = await createServer();
    const addr = srv.address;
    await srv.stop();
    server = null;
    // After stop, fetch should fail
    await expect(fetch(`${addr}/health`)).rejects.toThrow();
  });
});
