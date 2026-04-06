import http from 'node:http';
import type net from 'node:net';
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  OBSERVABILITY_DIR,
  OBSERVABILITY_EVENTS_FILE,
  RUNTIME_DIR,
  RUNTIME_CONTEXT_BUDGET_FILE,
  DASHBOARD_EMBEDDED_HTML_PATH,
  DASHBOARD_WS_PATH,
  DASHBOARD_HEARTBEAT_INTERVAL_MS,
  PACKAGE_ROOT,
} from '@shared/constants.js';
import { SignalBroadcaster } from './signal-broadcaster.js';
import { SignalAggregator } from './signal-aggregator.js';
import { SessionStore } from './session-store.js';
import { listProjects, registerProject } from './project-registry.js';
import type { BehaviorEvent } from '@app/behavior/behavior-event-emitter.js';
import type { SignalMessage } from '@domain/dashboard/signal-types.js';
import { MemoryPolicySchema } from '@domain/behavior/memory-policy.js';
import { ContextBudgetSchema } from '@domain/compaction/context-budget.js';
import { LoadOrderSchema } from '@domain/behavior/load-order.js';
import { readScores } from '@app/loop/trace-store.js';
import { loadPatterns } from '@app/loop/insight-store.js';
import { listTunings, revertTuning } from '@app/loop/policy-tuner.js';

const EDITABLE_CONFIG_FILES: ReadonlyMap<string, string> = new Map([
  ['memory-policy', path.join(RUNTIME_DIR, 'memory-policy.json')],
  ['context-budget', path.join(RUNTIME_DIR, RUNTIME_CONTEXT_BUDGET_FILE)],
  ['load-order', path.join(RUNTIME_DIR, 'load-order.json')],
]);

function getConfigDefaults(configName: string): unknown {
  switch (configName) {
    case 'memory-policy': return MemoryPolicySchema.parse({});
    case 'context-budget': return ContextBudgetSchema.parse({ model: {}, budgets: {}, thresholds: {}, current: {} });
    case 'load-order': return LoadOrderSchema.parse({});
    default: return null;
  }
}

export interface DashboardServerOptions {
  readonly workspaceRoot: string;
  readonly port: number;
  readonly host?: string;
  readonly sessionId?: string;
  readonly version?: string;
}

export class DashboardServer {
  private workspaceRoot: string;
  private readonly port: number;
  private readonly host: string;
  private sessionId: string;
  private readonly version: string;
  private server: http.Server | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private fileWatcher: fsSync.FSWatcher | null = null;
  private lastKnownEventCount = 0;
  private fileWatchDebounce: ReturnType<typeof setTimeout> | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private wss: any = null;

  readonly broadcaster: SignalBroadcaster;
  readonly aggregator: SignalAggregator;
  readonly sessionStore: SessionStore;

  constructor(options: DashboardServerOptions) {
    this.workspaceRoot = options.workspaceRoot;
    this.port = options.port;
    this.host = options.host ?? '127.0.0.1';
    this.sessionId = options.sessionId ?? 'unknown';
    this.version = options.version ?? '0.0.0';
    this.broadcaster = new SignalBroadcaster();
    this.aggregator = new SignalAggregator(this.broadcaster);
    this.sessionStore = new SessionStore(this.workspaceRoot, this.sessionId);

    const originalSend = this.broadcaster.send.bind(this.broadcaster);
    this.broadcaster.send = (signal: SignalMessage) => {
      this.sessionStore.recordSignal(signal);
      originalSend(signal);
    };
  }

  async start(): Promise<void> {
    await registerProject(this.workspaceRoot, this.version);
    await this.sessionStore.loadFromDisk();
    this.sessionStore.startPeriodicPersist();
    const { WebSocketServer } = await import('ws');

    this.server = http.createServer((req, res) => {
      void this.handleRequest(req, res);
    });

    this.wss = new WebSocketServer({ noServer: true });

    this.server.on('upgrade', (req: http.IncomingMessage, socket: net.Socket, head: Buffer) => {
      const url = new URL(req.url ?? '/', `http://${this.host}:${this.port}`);
      if (url.pathname === DASHBOARD_WS_PATH) {
        const reqUrl = req.url;
        this.wss.handleUpgrade(req, socket, head, (ws: unknown) => {
          void this.handleWebSocketConnection(ws as import('ws').WebSocket, reqUrl);
        });
      } else {
        socket.destroy();
      }
    });

    return new Promise((resolve) => {
      this.server!.listen(this.port, this.host, () => {
        this.startHeartbeat();
        this.startFileWatcher();
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    this.sessionStore.stopPeriodicPersist();
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.stopFileWatcher();
    if (this.server) {
      return new Promise((resolve) => {
        this.server!.close(() => resolve());
        this.server = null;
      });
    }
  }

  get address(): string {
    const addr = this.server?.address();
    const actualPort = (typeof addr === 'object' && addr !== null) ? addr.port : this.port;
    return `http://${this.host}:${actualPort}`;
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.broadcaster.broadcastHeartbeat();
    }, DASHBOARD_HEARTBEAT_INTERVAL_MS);
  }

  private stopFileWatcher(): void {
    if (this.fileWatcher) {
      this.fileWatcher.close();
      this.fileWatcher = null;
    }
    if (this.fileWatchDebounce) {
      clearTimeout(this.fileWatchDebounce);
      this.fileWatchDebounce = null;
    }
    this.lastKnownEventCount = 0;
  }

  private startFileWatcher(): void {
    const dirPath = path.join(this.workspaceRoot, OBSERVABILITY_DIR);

    void this.loadEvents().then((events) => {
      this.lastKnownEventCount = events.length;
    });

    try {
      fsSync.mkdirSync(dirPath, { recursive: true });
      this.fileWatcher = fsSync.watch(dirPath, (_eventType, filename) => {
        if (filename !== OBSERVABILITY_EVENTS_FILE && filename !== 'events.ndjson') return;
        if (this.fileWatchDebounce) clearTimeout(this.fileWatchDebounce);
        this.fileWatchDebounce = setTimeout(() => {
          void this.processNewEvents();
        }, 200);
      });
    } catch {
    }
  }

  private async processNewEvents(): Promise<void> {
    try {
      const allEvents = await this.loadEvents();
      const newCount = allEvents.length;
      if (newCount <= this.lastKnownEventCount) return;

      const newEvents = allEvents.slice(this.lastKnownEventCount);
      this.lastKnownEventCount = newCount;

      for (const event of newEvents) {
        this.aggregator.handleEvent(event as unknown as BehaviorEvent);
      }
    } catch {
    }
  }

  private async handleWebSocketConnection(ws: import('ws').WebSocket, requestUrl?: string): Promise<void> {
    const wsLike = ws as unknown as import('./signal-broadcaster.js').WebSocketLike;
    this.broadcaster.addClient(wsLike);

    let lastSequenceId = 0;
    if (requestUrl) {
      try {
        const url = new URL(requestUrl, `http://${this.host}:${this.port}`);
        const seqParam = url.searchParams.get('lastSequenceId');
        if (seqParam) lastSequenceId = parseInt(seqParam, 10) || 0;
      } catch {
      }
    }

    const budget = await this.loadBudget();
    const currentState = this.broadcaster.getState();
    this.broadcaster.sendInitTo(wsLike, {
      version: this.version,
      sessionId: this.sessionId,
      totalEvents: this.aggregator.getTotalEvents(),
      currentBudget: budget as Record<string, unknown> | null,
      currentEnforcement: currentState.enforcement,
      currentCompactionLevel: currentState.compaction,
      memoryTokens: currentState.memoryTokens,
      budgetThresholds: currentState.budgetThresholds,
    });

    const sendToThisClient = (signal: SignalMessage) => {
      if (wsLike.readyState === 1) {
        wsLike.send(JSON.stringify(signal));
      }
    };

    if (lastSequenceId > 0) {
      const missed = this.sessionStore.getSignalsSince(lastSequenceId);
      for (const signal of missed) {
        sendToThisClient(signal);
      }
    } else {
      const events = await this.loadEvents();
      for (const event of events) {
        this.aggregator.replayEvent(event as unknown as BehaviorEvent, sendToThisClient);
      }
    }

    const effSignals = await this.loadEffectivenessSignals();
    for (const signal of effSignals) {
      const syntheticEvent: Record<string, unknown> = {
        eventId: `eff_${String(signal.signalType ?? 'unknown')}_${String(signal.recordedAt ?? '')}`,
        eventType: `effectiveness.${String(signal.signalType ?? 'unknown')}`,
        occurredAt: String(signal.recordedAt ?? new Date().toISOString()),
        runtimeSessionId: this.sessionId,
        payload: signal,
      };
      this.aggregator.replayEvent(syntheticEvent as unknown as BehaviorEvent, sendToThisClient);
    }

    this.broadcaster.sendReadyTo(wsLike);

    ws.on('close', () => {
      this.broadcaster.removeClient(wsLike);
    });
  }

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const url = new URL(req.url ?? '/', `http://${this.host}:${this.port}`);
    const pathname = url.pathname;

    try {
      if (pathname === '/health') {
        this.sendJson(res, 200, { status: 'ok', timestamp: new Date().toISOString() });
      } else if (pathname === '/api/events' && req.method === 'GET') {
        const events = await this.loadEvents();
        this.sendJson(res, 200, events);
      } else if (pathname === '/api/budget' && req.method === 'GET') {
        const budget = await this.loadBudget();
        this.sendJson(res, 200, budget);
      } else if (pathname === '/api/compactions' && req.method === 'GET') {
        const events = await this.loadEvents();
        const compactions = events.filter(
          (e: Record<string, unknown>) =>
            typeof e.eventType === 'string' && e.eventType.includes('compaction'),
        );
        this.sendJson(res, 200, compactions);
      } else if (pathname === '/api/projects' && req.method === 'GET') {
        const projects = await listProjects();
        this.sendJson(res, 200, {
          projects,
          activeProject: this.workspaceRoot,
        });
      } else if (pathname === '/api/switch' && req.method === 'POST') {
        await this.handleProjectSwitch(req, res);
      } else if (pathname.startsWith('/api/config/') && req.method === 'GET') {
        const configName = pathname.slice('/api/config/'.length);
        await this.handleConfigRead(configName, res);
      } else if (pathname.startsWith('/api/config/') && req.method === 'PUT') {
        const configName = pathname.slice('/api/config/'.length);
        await this.handleConfigWrite(configName, req, res);
      } else if (pathname === '/api/effectiveness' && req.method === 'GET') {
        const signals = await this.loadEffectivenessSignals();
        this.sendJson(res, 200, signals);
      } else if (pathname === '/api/loop/health' && req.method === 'GET') {
        await this.handleLoopHealth(res);
      } else if (pathname === '/api/loop/scores' && req.method === 'GET') {
        const scores = await readScores(this.workspaceRoot, { limit: 20 });
        this.sendJson(res, 200, { scores });
      } else if (pathname === '/api/loop/patterns' && req.method === 'GET') {
        const patterns = await loadPatterns(this.workspaceRoot);
        this.sendJson(res, 200, { patterns });
      } else if (pathname === '/api/loop/tunings' && req.method === 'GET') {
        const tunings = await listTunings(this.workspaceRoot);
        this.sendJson(res, 200, { tunings });
      } else if (pathname === '/api/loop/revert-tuning' && req.method === 'POST') {
        await this.handleRevertTuning(req, res);
      } else if (pathname === '/sw.js') {
        this.serveServiceWorker(res);
      } else if (pathname === '/') {
        await this.serveDashboardHtml(res);
      } else {
        this.sendJson(res, 404, { error: 'Not found' });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      this.sendJson(res, 500, { error: message });
    }
  }

  private async handleProjectSwitch(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const body = await new Promise<string>((resolve) => {
      let data = '';
      req.on('data', (chunk: Buffer) => { data += chunk.toString(); });
      req.on('end', () => resolve(data));
    });

    try {
      const { rootPath } = JSON.parse(body) as { rootPath: string };
      if (!rootPath) {
        this.sendJson(res, 400, { error: 'rootPath is required' });
        return;
      }

      const absPath = path.resolve(rootPath);
      const hforgeDir = path.join(absPath, '.hforge');
      try {
        await fs.stat(hforgeDir);
      } catch {
        this.sendJson(res, 404, { error: `No .hforge directory found at ${absPath}` });
        return;
      }

      this.workspaceRoot = absPath;

      this.stopFileWatcher();
      this.startFileWatcher();

      this.sessionId = `dash_${Date.now().toString(36)}`;
      this.sessionStore.updateWorkspace(absPath, this.sessionId);
      await registerProject(absPath, this.version);

      this.broadcaster.broadcastProjectSwitch({
        rootPath: absPath,
        name: path.basename(absPath),
        sessionId: this.sessionId,
      });

      this.sendJson(res, 200, {
        switched: true,
        activeProject: absPath,
        name: path.basename(absPath),
        sessionId: this.sessionId,
      });
    } catch {
      this.sendJson(res, 400, { error: 'Invalid JSON body' });
    }
  }

  private async handleConfigRead(configName: string, res: http.ServerResponse): Promise<void> {
    const relativePath = EDITABLE_CONFIG_FILES.get(configName);
    if (!relativePath) {
      this.sendJson(res, 404, { error: `Unknown config: ${configName}. Available: ${[...EDITABLE_CONFIG_FILES.keys()].join(', ')}` });
      return;
    }
    const filePath = path.join(this.workspaceRoot, relativePath);
    try {
      const content = await fs.readFile(filePath, 'utf8');
      this.sendJson(res, 200, { name: configName, path: relativePath, content: JSON.parse(content), source: 'file' });
    } catch {
      const defaults = getConfigDefaults(configName);
      if (defaults) {
        this.sendJson(res, 200, { name: configName, path: relativePath, content: defaults, source: 'defaults' });
      } else {
        this.sendJson(res, 404, { error: `Config file not found: ${relativePath}` });
      }
    }
  }

  private async handleConfigWrite(configName: string, req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const relativePath = EDITABLE_CONFIG_FILES.get(configName);
    if (!relativePath) {
      this.sendJson(res, 404, { error: `Unknown config: ${configName}` });
      return;
    }
    const filePath = path.join(this.workspaceRoot, relativePath);

    const body = await new Promise<string>((resolve) => {
      let data = '';
      req.on('data', (chunk: Buffer) => { data += chunk.toString(); });
      req.on('end', () => resolve(data));
    });

    try {
      const parsed = JSON.parse(body) as { content: unknown };
      if (!parsed.content || typeof parsed.content !== 'object') {
        this.sendJson(res, 400, { error: 'Body must contain a "content" object' });
        return;
      }

      await fs.mkdir(path.dirname(filePath), { recursive: true });

      try {
        const current = await fs.readFile(filePath, 'utf8');
        await fs.writeFile(`${filePath}.bak`, current, 'utf8');
      } catch {
      }

      const tmpPath = `${filePath}.tmp`;
      const formatted = JSON.stringify(parsed.content, null, 2);
      await fs.writeFile(tmpPath, formatted, 'utf8');
      await fs.rename(tmpPath, filePath);

      this.sendJson(res, 200, { saved: true, name: configName, path: relativePath });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Write failed';
      this.sendJson(res, 400, { error: message });
    }
  }

  private async handleLoopHealth(res: http.ServerResponse): Promise<void> {
    const events = await this.loadEvents();
    let observeCount = 0;
    let learnCount = 0;
    let adaptCount = 0;
    let shareCount = 0;
    let importCount = 0;
    let lastCycleAt: string | null = null;

    for (const event of events) {
      const eventType = event.eventType as string | undefined;
      if (!eventType) continue;
      const occurredAt = event.occurredAt as string | undefined;

      if (eventType === 'loop.trace.recorded') {
        observeCount++;
        if (occurredAt && (!lastCycleAt || occurredAt > lastCycleAt)) lastCycleAt = occurredAt;
      } else if (eventType === 'loop.pattern.extracted') {
        learnCount++;
        if (occurredAt && (!lastCycleAt || occurredAt > lastCycleAt)) lastCycleAt = occurredAt;
      } else if (eventType === 'loop.tuning.applied' || eventType === 'loop.tuning.reverted') {
        adaptCount++;
        if (occurredAt && (!lastCycleAt || occurredAt > lastCycleAt)) lastCycleAt = occurredAt;
      } else if (eventType === 'loop.bundle.exported') {
        shareCount++;
        if (occurredAt && (!lastCycleAt || occurredAt > lastCycleAt)) lastCycleAt = occurredAt;
      } else if (eventType === 'loop.bundle.imported') {
        importCount++;
        if (occurredAt && (!lastCycleAt || occurredAt > lastCycleAt)) lastCycleAt = occurredAt;
      }
    }

    const total = observeCount + learnCount + adaptCount + shareCount + importCount;
    const stagesFired = [observeCount, learnCount, adaptCount, shareCount + importCount]
      .filter((c) => c > 0).length;
    const healthScore = total === 0 ? 0 : Math.round((stagesFired / 4) * 100);

    this.sendJson(res, 200, {
      observeCount,
      learnCount,
      adaptCount,
      shareCount,
      importCount,
      healthScore,
      lastCycleAt,
    });
  }

  private async handleRevertTuning(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const body = await new Promise<string>((resolve) => {
      let data = '';
      req.on('data', (chunk: Buffer) => { data += chunk.toString(); });
      req.on('end', () => resolve(data));
    });

    try {
      const { tuningId } = JSON.parse(body) as { tuningId: string };
      if (!tuningId) {
        this.sendJson(res, 400, { error: 'tuningId is required' });
        return;
      }
      const result = await revertTuning(this.workspaceRoot, tuningId);
      this.sendJson(res, 200, { success: result !== null, tuning: result });
    } catch {
      this.sendJson(res, 400, { error: 'Invalid JSON body' });
    }
  }

  private serveServiceWorker(res: http.ServerResponse): void {
    const sw = `// Harness Forge Dashboard Service Worker
self.addEventListener('install',()=>{self.skipWaiting()});
self.addEventListener('activate',(e)=>{e.waitUntil(self.clients.claim())});
self.addEventListener('message',(e)=>{
  const d=e.data;if(!d||d.type!=='HARNESS_NOTIFICATION')return;
  e.waitUntil(self.registration.showNotification(d.title||'Harness Forge',{
    body:d.body||'',tag:d.tag||'hforge-event',silent:false,requireInteraction:false
  }));
});
self.addEventListener('notificationclick',(e)=>{
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(c=>{
    for(const w of c){if('focus'in w)return w.focus()}
    return self.clients.openWindow('/');
  }));
});`;
    res.writeHead(200, {
      'Content-Type': 'application/javascript',
      'Service-Worker-Allowed': '/',
    });
    res.end(sw);
  }

  private async serveDashboardHtml(res: http.ServerResponse): Promise<void> {
    const htmlPath = path.join(PACKAGE_ROOT, 'src', DASHBOARD_EMBEDDED_HTML_PATH);
    try {
      const html = await fs.readFile(htmlPath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<!DOCTYPE html>
<html><head><title>Harness Dashboard</title></head>
<body style="background:#1a1a2e;color:#eee;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
<div style="text-align:center">
<h1>Harness Forge Dashboard</h1>
<p>Dashboard HTML not built yet. Run: <code>npm run build:dashboard</code></p>
<p>WebSocket endpoint: <code>ws://${this.host}:${this.port}${DASHBOARD_WS_PATH}</code></p>
</div></body></html>`);
    }
  }

  private sendJson(res: http.ServerResponse, statusCode: number, data: unknown): void {
    res.writeHead(statusCode, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify(data));
  }

  private async loadEvents(): Promise<readonly Record<string, unknown>[]> {
    const ndjsonPath = path.join(this.workspaceRoot, OBSERVABILITY_DIR, 'events.ndjson');
    try {
      const content = await fs.readFile(ndjsonPath, 'utf8');
      const events = content
        .split('\n')
        .filter((line) => line.trim().length > 0)
        .map((line) => JSON.parse(line) as Record<string, unknown>);
      if (events.length > 0) return events;
    } catch {
    }

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
      return null;
    }
  }

  private async loadEffectivenessSignals(): Promise<readonly Record<string, unknown>[]> {
    const signalsPath = path.join(this.workspaceRoot, OBSERVABILITY_DIR, 'effectiveness-signals.json');
    try {
      const content = await fs.readFile(signalsPath, 'utf8');
      return JSON.parse(content) as Record<string, unknown>[];
    } catch {
      return [];
    }
  }
}
