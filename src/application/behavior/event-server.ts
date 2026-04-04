import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createReadStream, existsSync } from 'node:fs';
import readline from 'node:readline';

import { OBSERVABILITY_DIR, OBSERVABILITY_EVENTS_FILE, RUNTIME_DIR, RUNTIME_CONTEXT_BUDGET_FILE } from '@shared/constants.js';

export interface EventServerOptions {
  readonly workspaceRoot: string;
  readonly port?: number;
  readonly host?: string;
}

export class EventServer {
  private readonly workspaceRoot: string;
  private readonly port: number;
  private readonly host: string;
  private server: http.Server | null = null;

  constructor(options: EventServerOptions) {
    this.workspaceRoot = options.workspaceRoot;
    this.port = options.port ?? 4571;
    this.host = options.host ?? '127.0.0.1';
  }

  async start(): Promise<void> {
    this.server = http.createServer((req, res) => {
      void this.handleRequest(req, res);
    });

    return new Promise((resolve) => {
      this.server!.listen(this.port, this.host, () => {
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server!.close(() => resolve());
        this.server = null;
      });
    }
  }

  get address(): string {
    return `http://${this.host}:${this.port}`;
  }

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const url = new URL(req.url ?? '/', `http://${this.host}:${this.port}`);
    const pathname = url.pathname;

    try {
      if (pathname === '/health') {
        this.sendJson(res, 200, { status: 'ok', timestamp: new Date().toISOString() });
      } else if (pathname === '/events' && req.method === 'GET') {
        const events = await this.loadEvents();
        this.sendJson(res, 200, events);
      } else if (pathname === '/events/stream' && req.method === 'GET') {
        this.startSSEStream(res);
      } else if (pathname.startsWith('/sessions/') && req.method === 'GET') {
        const sessionId = pathname.slice('/sessions/'.length);
        const events = await this.loadEvents();
        const filtered = events.filter(
          (e: Record<string, unknown>) => e.runtimeSessionId === sessionId,
        );
        this.sendJson(res, 200, filtered);
      } else if (pathname === '/budgets' && req.method === 'GET') {
        const budget = await this.loadBudget();
        this.sendJson(res, 200, budget);
      } else if (pathname === '/compactions' && req.method === 'GET') {
        const events = await this.loadEvents();
        const compactions = events.filter(
          (e: Record<string, unknown>) =>
            typeof e.eventType === 'string' && e.eventType.includes('compaction'),
        );
        this.sendJson(res, 200, compactions);
      } else {
        this.sendJson(res, 404, { error: 'Not found' });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      this.sendJson(res, 500, { error: message });
    }
  }

  private sendJson(res: http.ServerResponse, statusCode: number, data: unknown): void {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  }

  private startSSEStream(res: http.ServerResponse): void {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    res.write('data: {"connected":true}\n\n');
    // Keep connection alive; in a full implementation, tail the NDJSON file
    const keepAlive = setInterval(() => {
      res.write(': keepalive\n\n');
    }, 15000);
    res.on('close', () => clearInterval(keepAlive));
  }

  private async loadEvents(): Promise<readonly Record<string, unknown>[]> {
    const eventsPath = path.join(this.workspaceRoot, OBSERVABILITY_DIR, OBSERVABILITY_EVENTS_FILE);
    try {
      const content = await fs.readFile(eventsPath, 'utf8');
      return JSON.parse(content) as Record<string, unknown>[];
    } catch {
      return [];
    }
  }

  private async loadBudget(): Promise<unknown> {
    const budgetPath = path.join(this.workspaceRoot, RUNTIME_DIR, RUNTIME_CONTEXT_BUDGET_FILE);
    try {
      const content = await fs.readFile(budgetPath, 'utf8');
      return JSON.parse(content);
    } catch {
      return { error: 'No budget file found' };
    }
  }
}
