import fs from 'node:fs/promises';
import path from 'node:path';
import type { SignalMessage } from '@domain/dashboard/signal-types.js';
import type { RuntimeStateSnapshot } from '@domain/dashboard/signal-types.js';

const MAX_SIGNAL_HISTORY = 2000;
const PERSIST_INTERVAL_MS = 10_000;

export interface PersistedDashboardSession {
  readonly schemaVersion: string;
  readonly savedAt: string;
  readonly workspaceRoot: string;
  readonly sessionId: string;
  readonly lastSequenceId: number;
  readonly state: RuntimeStateSnapshot;
  readonly eventCounts: Record<string, number>;
  readonly totalEvents: number;
  readonly signals: readonly SignalMessage[];
}

export class SessionStore {
  private readonly signals: SignalMessage[] = [];
  private persistTimer: ReturnType<typeof setInterval> | null = null;
  private workspaceRoot: string;
  private sessionId: string;
  private lastState: RuntimeStateSnapshot;
  private eventCounts: Record<string, number> = {};
  private totalEvents = 0;
  private dirty = false;

  constructor(workspaceRoot: string, sessionId: string) {
    this.workspaceRoot = workspaceRoot;
    this.sessionId = sessionId;
    this.lastState = {
      enforcement: 'guidance',
      compaction: 'none',
      memoryTokens: 0,
      budgetPercent: 0,
      budgetThresholds: { evaluateAt: 0.7, trimAt: 0.8, summarizeAt: 0.88, rollupAt: 0.93, rolloverAt: 0.96 },
    };
  }

  recordSignal(signal: SignalMessage): void {
    this.signals.push(signal);
    if (this.signals.length > MAX_SIGNAL_HISTORY) {
      this.signals.splice(0, this.signals.length - MAX_SIGNAL_HISTORY);
    }
    this.dirty = true;
  }

  recordEventCount(eventType: string): void {
    this.eventCounts[eventType] = (this.eventCounts[eventType] ?? 0) + 1;
    this.totalEvents += 1;
  }

  updateState(state: RuntimeStateSnapshot): void {
    this.lastState = state;
    this.dirty = true;
  }

  updateWorkspace(workspaceRoot: string, sessionId: string): void {
    this.workspaceRoot = workspaceRoot;
    this.sessionId = sessionId;
    this.signals.length = 0;
    this.eventCounts = {};
    this.totalEvents = 0;
    this.dirty = true;
  }

  getSignalsSince(sequenceId: number): readonly SignalMessage[] {
    return this.signals.filter((s) => s.sequenceId > sequenceId);
  }

  getLastSequenceId(): number {
    if (this.signals.length === 0) return 0;
    return this.signals[this.signals.length - 1]!.sequenceId;
  }

  startPeriodicPersist(): void {
    this.persistTimer = setInterval(() => {
      if (this.dirty) {
        void this.persistToDisk();
        this.dirty = false;
      }
    }, PERSIST_INTERVAL_MS);
  }

  stopPeriodicPersist(): void {
    if (this.persistTimer) {
      clearInterval(this.persistTimer);
      this.persistTimer = null;
    }
    // Final save
    if (this.dirty) {
      void this.persistToDisk();
    }
  }

  async loadFromDisk(): Promise<boolean> {
    const filePath = this.getSessionFilePath();
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const session = JSON.parse(content) as PersistedDashboardSession;

      // Only restore if same workspace
      if (session.workspaceRoot !== this.workspaceRoot) return false;

      // Restore state
      this.lastState = session.state;
      this.eventCounts = { ...session.eventCounts };
      this.totalEvents = session.totalEvents;

      // Restore recent signals
      for (const signal of session.signals) {
        this.signals.push(signal);
      }

      return true;
    } catch {
      return false;
    }
  }

  private async persistToDisk(): Promise<void> {
    const filePath = this.getSessionFilePath();
    const session: PersistedDashboardSession = {
      schemaVersion: '1.0.0',
      savedAt: new Date().toISOString(),
      workspaceRoot: this.workspaceRoot,
      sessionId: this.sessionId,
      lastSequenceId: this.getLastSequenceId(),
      state: this.lastState,
      eventCounts: { ...this.eventCounts },
      totalEvents: this.totalEvents,
      signals: this.signals.slice(-500), // Persist last 500 signals to keep file small
    };

    try {
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(session, null, 2), 'utf8');
    } catch {
      // Disk write failed — non-critical, continue
    }
  }

  private getSessionFilePath(): string {
    return path.join(this.workspaceRoot, '.hforge', 'observability', 'dashboard-session.json');
  }
}
