import { describe, it, expect, afterEach } from 'vitest';
import { DashboardServer } from '../../src/application/dashboard/dashboard-server.js';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';

describe('Dashboard loop API endpoints', () => {
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
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hforge-loop-dash-'));
    server = new DashboardServer({
      workspaceRoot: tmpDir,
      port: 0,
      sessionId: 'test_loop_session',
      version: '1.0.0-test',
    });
    await server.start();
    return server;
  }

  describe('GET /api/loop/health', () => {
    it('returns correct health shape with zero counts when empty', async () => {
      const srv = await createServer();
      const res = await fetch(`${srv.address}/api/loop/health`);
      expect(res.status).toBe(200);
      const body = await res.json() as Record<string, unknown>;
      expect(body).toHaveProperty('observeCount');
      expect(body).toHaveProperty('learnCount');
      expect(body).toHaveProperty('adaptCount');
      expect(body).toHaveProperty('shareCount');
      expect(body).toHaveProperty('importCount');
      expect(body).toHaveProperty('healthScore');
      expect(body).toHaveProperty('lastCycleAt');
      expect(body.observeCount).toBe(0);
      expect(body.learnCount).toBe(0);
      expect(body.adaptCount).toBe(0);
      expect(body.shareCount).toBe(0);
      expect(body.importCount).toBe(0);
      expect(typeof body.healthScore).toBe('number');
    });
  });

  describe('GET /api/loop/scores', () => {
    it('returns scores array (empty when no data)', async () => {
      const srv = await createServer();
      const res = await fetch(`${srv.address}/api/loop/scores`);
      expect(res.status).toBe(200);
      const body = await res.json() as { scores: unknown[] };
      expect(body).toHaveProperty('scores');
      expect(Array.isArray(body.scores)).toBe(true);
    });
  });

  describe('GET /api/loop/patterns', () => {
    it('returns patterns array (empty when no data)', async () => {
      const srv = await createServer();
      const res = await fetch(`${srv.address}/api/loop/patterns`);
      expect(res.status).toBe(200);
      const body = await res.json() as { patterns: unknown[] };
      expect(body).toHaveProperty('patterns');
      expect(Array.isArray(body.patterns)).toBe(true);
    });
  });

  describe('GET /api/loop/tunings', () => {
    it('returns tunings array (empty when no data)', async () => {
      const srv = await createServer();
      const res = await fetch(`${srv.address}/api/loop/tunings`);
      expect(res.status).toBe(200);
      const body = await res.json() as { tunings: unknown[] };
      expect(body).toHaveProperty('tunings');
      expect(Array.isArray(body.tunings)).toBe(true);
    });
  });

  describe('POST /api/loop/revert-tuning', () => {
    it('returns not-found for nonexistent tuning', async () => {
      const srv = await createServer();
      const res = await fetch(`${srv.address}/api/loop/revert-tuning`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tuningId: 'nonexistent_id' }),
      });
      expect(res.status).toBe(200);
      const body = await res.json() as { success: boolean; tuning: unknown };
      expect(body.success).toBe(false);
      expect(body.tuning).toBeNull();
    });
  });
});
