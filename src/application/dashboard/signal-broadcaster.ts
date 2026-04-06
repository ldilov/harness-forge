import type { SignalMessage, SystemInitPayload, HeartbeatPayload, RuntimeStateSnapshot } from '@domain/dashboard/signal-types.js';
import type { SignalSink } from './signal-aggregator.js';

export interface WebSocketLike {
  send(data: string): void;
  readonly readyState: number;
}

const WS_OPEN = 1;

export class SignalBroadcaster implements SignalSink {
  private readonly clients: Set<WebSocketLike> = new Set();
  private readonly startTime: number;
  private sequenceId = 0;
  private totalEventsSent = 0;

  constructor() {
    this.startTime = Date.now();
  }

  addClient(ws: WebSocketLike): void {
    this.clients.add(ws);
  }

  removeClient(ws: WebSocketLike): void {
    this.clients.delete(ws);
  }

  getClientCount(): number {
    return this.clients.size;
  }

  send(signal: SignalMessage): void {
    this.totalEventsSent += 1;
    const data = JSON.stringify(signal);
    for (const client of this.clients) {
      if (client.readyState === WS_OPEN) {
        client.send(data);
      }
    }
  }

  sendInitTo(ws: WebSocketLike, payload: SystemInitPayload): void {
    this.sequenceId += 1;
    const signal: SignalMessage = {
      type: 'state',
      channel: 'system.init',
      payload: payload as unknown as Record<string, unknown>,
      timestamp: new Date().toISOString(),
      sequenceId: this.sequenceId,
    };
    ws.send(JSON.stringify(signal));
  }

  sendReadyTo(ws: WebSocketLike): void {
    this.sequenceId += 1;
    const signal: SignalMessage = {
      type: 'state',
      channel: 'system.ready',
      payload: {},
      timestamp: new Date().toISOString(),
      sequenceId: this.sequenceId,
    };
    ws.send(JSON.stringify(signal));
  }

  broadcastProjectSwitch(payload: { rootPath: string; name: string; sessionId: string }): void {
    this.sequenceId += 1;
    const signal: SignalMessage = {
      type: 'state',
      channel: 'system.project.switched',
      payload: payload as unknown as Record<string, unknown>,
      timestamp: new Date().toISOString(),
      sequenceId: this.sequenceId,
    };
    const data = JSON.stringify(signal);
    for (const client of this.clients) {
      if (client.readyState === WS_OPEN) {
        client.send(data);
      }
    }
  }

  private currentState: RuntimeStateSnapshot = {
    enforcement: 'guidance',
    compaction: 'none',
    memoryTokens: 0,
    budgetPercent: 0,
    budgetThresholds: { evaluateAt: 0.7, trimAt: 0.8, summarizeAt: 0.88, rollupAt: 0.93, rolloverAt: 0.96 },
  };

  updateState(state: Partial<RuntimeStateSnapshot>): void {
    this.currentState = { ...this.currentState, ...state };
  }

  getState(): RuntimeStateSnapshot {
    return this.currentState;
  }

  broadcastHeartbeat(): void {
    this.sequenceId += 1;
    const payload: HeartbeatPayload = {
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      totalEvents: this.totalEventsSent,
      state: this.currentState,
    };
    const signal: SignalMessage = {
      type: 'state',
      channel: 'system.heartbeat',
      payload: payload as unknown as Record<string, unknown>,
      timestamp: new Date().toISOString(),
      sequenceId: this.sequenceId,
    };
    const data = JSON.stringify(signal);
    for (const client of this.clients) {
      if (client.readyState === WS_OPEN) {
        client.send(data);
      }
    }
  }
}
