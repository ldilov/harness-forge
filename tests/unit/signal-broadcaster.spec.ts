import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SignalBroadcaster, type WebSocketLike } from '../../src/application/dashboard/signal-broadcaster.js';
import type { SignalMessage } from '../../src/domain/dashboard/signal-types.js';

function makeMockWs(readyState = 1): WebSocketLike & { sentData: string[] } {
  const sentData: string[] = [];
  return {
    readyState,
    send: (data: string) => sentData.push(data),
    sentData,
  };
}

describe('SignalBroadcaster', () => {
  let broadcaster: SignalBroadcaster;

  beforeEach(() => {
    broadcaster = new SignalBroadcaster();
  });

  it('broadcasts signal to all connected clients', () => {
    const ws1 = makeMockWs();
    const ws2 = makeMockWs();
    broadcaster.addClient(ws1);
    broadcaster.addClient(ws2);

    const signal: SignalMessage = {
      type: 'event',
      channel: 'test',
      payload: { foo: 'bar' },
      timestamp: new Date().toISOString(),
      sequenceId: 1,
    };
    broadcaster.send(signal);

    expect(ws1.sentData.length).toBe(1);
    expect(ws2.sentData.length).toBe(1);
    expect(JSON.parse(ws1.sentData[0]!)).toMatchObject({ type: 'event', channel: 'test' });
  });

  it('skips clients with non-OPEN readyState', () => {
    const openWs = makeMockWs(1);
    const closedWs = makeMockWs(3);
    broadcaster.addClient(openWs);
    broadcaster.addClient(closedWs);

    broadcaster.send({
      type: 'event',
      channel: 'test',
      payload: {},
      timestamp: new Date().toISOString(),
      sequenceId: 1,
    });

    expect(openWs.sentData.length).toBe(1);
    expect(closedWs.sentData.length).toBe(0);
  });

  it('removes client correctly', () => {
    const ws = makeMockWs();
    broadcaster.addClient(ws);
    expect(broadcaster.getClientCount()).toBe(1);

    broadcaster.removeClient(ws);
    expect(broadcaster.getClientCount()).toBe(0);
  });

  it('sends system.init to a specific client', () => {
    const ws = makeMockWs();
    broadcaster.sendInitTo(ws, {
      version: '1.4.1',
      sessionId: 'sess_test',
      totalEvents: 42,
      currentBudget: null,
      currentEnforcement: 'guidance',
      currentCompactionLevel: 'none',
      memoryTokens: 800,
      budgetThresholds: { evaluateAt: 0.7, trimAt: 0.8, summarizeAt: 0.88, rollupAt: 0.93, rolloverAt: 0.96 },
    });

    expect(ws.sentData.length).toBe(1);
    const parsed = JSON.parse(ws.sentData[0]!) as SignalMessage;
    expect(parsed.type).toBe('state');
    expect(parsed.channel).toBe('system.init');
    expect((parsed.payload as Record<string, unknown>).sessionId).toBe('sess_test');
  });

  it('sends system.ready to a specific client', () => {
    const ws = makeMockWs();
    broadcaster.sendReadyTo(ws);

    expect(ws.sentData.length).toBe(1);
    const parsed = JSON.parse(ws.sentData[0]!) as SignalMessage;
    expect(parsed.type).toBe('state');
    expect(parsed.channel).toBe('system.ready');
  });

  it('broadcasts heartbeat to all clients', () => {
    const ws1 = makeMockWs();
    const ws2 = makeMockWs();
    broadcaster.addClient(ws1);
    broadcaster.addClient(ws2);

    broadcaster.broadcastHeartbeat();

    expect(ws1.sentData.length).toBe(1);
    expect(ws2.sentData.length).toBe(1);
    const parsed = JSON.parse(ws1.sentData[0]!) as SignalMessage;
    expect(parsed.type).toBe('state');
    expect(parsed.channel).toBe('system.heartbeat');
    expect((parsed.payload as Record<string, unknown>).uptime).toBeTypeOf('number');
    // Heartbeat now includes deterministic state snapshot
    const state = (parsed.payload as Record<string, unknown>).state as Record<string, unknown>;
    expect(state).toBeDefined();
    expect(state.enforcement).toBe('guidance');
    expect(state.compaction).toBe('none');
  });

  it('updateState changes the state included in heartbeats', () => {
    const ws = makeMockWs();
    broadcaster.addClient(ws);

    broadcaster.updateState({ enforcement: 'nudge', compaction: 'trim', memoryTokens: 3200 });
    broadcaster.broadcastHeartbeat();

    const parsed = JSON.parse(ws.sentData[0]!) as SignalMessage;
    const state = (parsed.payload as Record<string, unknown>).state as Record<string, unknown>;
    expect(state.enforcement).toBe('nudge');
    expect(state.compaction).toBe('trim');
    expect(state.memoryTokens).toBe(3200);
  });
});
