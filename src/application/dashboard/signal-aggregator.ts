import type { BehaviorEvent } from '@app/behavior/behavior-event-emitter.js';
import type { SignalMessage, MetricSnapshot, EnforcementLevelId, CompactionLevelId, RuntimeStateSnapshot } from '@domain/dashboard/signal-types.js';
import { findChannelsForEventType } from '@domain/dashboard/signal-channels.js';

export interface SignalSink {
  send(signal: SignalMessage): void;
  updateState?(state: Partial<RuntimeStateSnapshot>): void;
}

export class SignalAggregator {
  private sequenceId = 0;
  private readonly eventCounts: Map<string, number> = new Map();
  private readonly recentTimestamps: number[] = [];
  private readonly rateWindowMs: number;

  constructor(
    private readonly sink: SignalSink,
    rateWindowMs = 300_000,
  ) {
    this.rateWindowMs = rateWindowMs;
  }

  handleEvent(event: BehaviorEvent): void {
    this.trackEventCount(event.eventType);
    this.trackEventRate();

    const channels = findChannelsForEventType(event.eventType);

    for (const channel of channels) {
      const signal = this.buildSignal('event', channel.name, {
        eventId: event.eventId,
        eventType: event.eventType,
        occurredAt: event.occurredAt,
        runtimeSessionId: event.runtimeSessionId,
        ...(event.taskId !== undefined ? { taskId: event.taskId } : {}),
        ...(event.correlationId !== undefined ? { correlationId: event.correlationId } : {}),
        payload: event.payload,
      });
      this.sink.send(signal);
    }

    this.emitDerivedMetrics(event);
  }

  replayEvent(event: BehaviorEvent, targetSend?: (signal: SignalMessage) => void): void {
    this.trackEventCount(event.eventType);

    const send = targetSend ?? this.sink.send.bind(this.sink);
    const channels = findChannelsForEventType(event.eventType);
    for (const channel of channels) {
      const signal = this.buildSignal('replay', channel.name, {
        eventId: event.eventId,
        eventType: event.eventType,
        occurredAt: event.occurredAt,
        runtimeSessionId: event.runtimeSessionId,
        payload: event.payload,
      });
      send(signal);
    }
  }

  getEventCounts(): ReadonlyMap<string, number> {
    return this.eventCounts;
  }

  getTotalEvents(): number {
    let total = 0;
    for (const count of this.eventCounts.values()) {
      total += count;
    }
    return total;
  }

  getEventRate(): number {
    const now = Date.now();
    const cutoff = now - this.rateWindowMs;
    const recent = this.recentTimestamps.filter((t) => t >= cutoff);
    if (this.rateWindowMs <= 0) return 0;
    return (recent.length / this.rateWindowMs) * 60_000;
  }

  private trackEventCount(eventType: string): void {
    const current = this.eventCounts.get(eventType) ?? 0;
    this.eventCounts.set(eventType, current + 1);
  }

  private trackEventRate(): void {
    this.recentTimestamps.push(Date.now());
    const cutoff = Date.now() - this.rateWindowMs;
    while (this.recentTimestamps.length > 0 && this.recentTimestamps[0]! < cutoff) {
      this.recentTimestamps.shift();
    }
  }

  private emitDerivedMetrics(event: BehaviorEvent): void {
    if (event.payload.budgetState) {
      const { estimatedTokens, hardCap } = event.payload.budgetState;
      const percent = hardCap > 0 ? (estimatedTokens / hardCap) * 100 : 0;
      this.emitMetric('budget.usage.percent', percent, 'percent', 'current');
      this.emitMetric('budget.usage.tokens', estimatedTokens, 'tokens', 'current');

      // Deterministic enforcement level from server-side thresholds
      const enforcement = this.resolveEnforcementLevel(percent);
      this.sink.updateState?.({ enforcement, memoryTokens: estimatedTokens, budgetPercent: percent });
    }

    if (event.payload.tokensBeforeAfter) {
      const { before, after } = event.payload.tokensBeforeAfter;
      this.emitMetric('compaction.tokens.before', before, 'tokens', 'current');
      this.emitMetric('compaction.tokens.after', after, 'tokens', 'current');
      this.emitMetric('compaction.tokens.saved', before - after, 'tokens', 'current');
      this.sink.updateState?.({ memoryTokens: after });
    }

    if (event.payload.suppressionCounts) {
      const { total, suppressed } = event.payload.suppressionCounts;
      const ratio = total > 0 ? (suppressed / total) * 100 : 0;
      this.emitMetric('suppression.ratio', ratio, 'percent', 'current');
    }

    // Deterministic compaction level from event type
    if (event.eventType === 'context.compaction.triggered' || event.eventType === 'context.compaction.completed') {
      const level = (event.payload as Record<string, unknown>).level;
      if (typeof level === 'string') {
        this.sink.updateState?.({ compaction: level as CompactionLevelId });
      }
    }

    // Command duration tracking
    if (event.eventType === 'command.completed' || event.eventType === 'command.failed') {
      const durationMs = (event.payload as Record<string, unknown>).durationMs;
      if (typeof durationMs === 'number') {
        this.emitMetric('command.duration', durationMs, 'ms', 'current');
      }
    }

    // Install progress tracking
    if (event.eventType === 'install.operation.applied') {
      const installOps = this.eventCounts.get('install.operation.applied') ?? 0;
      this.emitMetric('install.operations.total', installOps, 'count', 'session');
    }

    // Install completion duration
    if (event.eventType === 'install.completed') {
      const durationMs = (event.payload as Record<string, unknown>).durationMs;
      if (typeof durationMs === 'number') {
        this.emitMetric('install.duration', durationMs, 'ms', 'current');
      }
    }

    // Error rate tracking
    if (event.eventType === 'command.failed' || event.eventType === 'memory.rotation.failed') {
      const totalCommands = (this.eventCounts.get('command.completed') ?? 0)
        + (this.eventCounts.get('command.failed') ?? 0);
      const failedCommands = this.eventCounts.get('command.failed') ?? 0;
      if (totalCommands > 0) {
        this.emitMetric('command.error.rate', (failedCommands / totalCommands) * 100, 'percent', 'session');
      }
    }

    this.emitMetric('events.rate', this.getEventRate(), 'events/min', '5m');
    this.emitMetric('events.total', this.getTotalEvents(), 'count', 'session');
  }

  private resolveEnforcementLevel(budgetPercent: number): EnforcementLevelId {
    if (budgetPercent >= 96) return 'enforcement';
    if (budgetPercent >= 93) return 'nudge';
    if (budgetPercent >= 88) return 'defaults';
    if (budgetPercent >= 70) return 'defaults';
    return 'guidance';
  }

  private emitMetric(name: string, value: number, unit: string, window: string): void {
    const metric: MetricSnapshot = {
      name,
      value,
      unit,
      window,
      timestamp: new Date().toISOString(),
    };
    const channel = name.split('.').slice(0, 2).join('.');
    const signal = this.buildSignal('metric', channel, metric as unknown as Record<string, unknown>);
    this.sink.send(signal);
  }

  private buildSignal(
    type: SignalMessage['type'],
    channel: string,
    payload: Readonly<Record<string, unknown>>,
  ): SignalMessage {
    this.sequenceId += 1;
    return {
      type,
      channel,
      payload,
      timestamp: new Date().toISOString(),
      sequenceId: this.sequenceId,
    };
  }
}
