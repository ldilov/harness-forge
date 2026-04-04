import type { EventEnvelope } from '../../domain/observability/events/event-envelope.js';

export interface CostSummary {
  readonly durationMs: number;
  readonly tokensUsed: number;
  readonly apiCalls: number;
  readonly eventCount: number;
}

function emptySummary(): CostSummary {
  return { durationMs: 0, tokensUsed: 0, apiCalls: 0, eventCount: 0 };
}

function mergeCost(existing: CostSummary, evt: EventEnvelope): CostSummary {
  const cost = evt.cost;
  if (!cost) return existing;
  return {
    durationMs: existing.durationMs + (cost.durationMs ?? 0),
    tokensUsed: existing.tokensUsed + (cost.tokensUsed ?? 0),
    apiCalls: existing.apiCalls + (cost.apiCalls ?? 0),
    eventCount: existing.eventCount + 1,
  };
}

export function aggregateCostByTaskId(
  events: readonly EventEnvelope[],
): ReadonlyMap<string, CostSummary> {
  const result = new Map<string, CostSummary>();
  for (const evt of events) {
    const key = evt.taskId;
    if (!key || !evt.cost) continue;
    const existing = result.get(key) ?? emptySummary();
    result.set(key, mergeCost(existing, evt));
  }
  return result;
}

export function aggregateCostByCorrelationId(
  events: readonly EventEnvelope[],
): ReadonlyMap<string, CostSummary> {
  const result = new Map<string, CostSummary>();
  for (const evt of events) {
    const key = evt.correlationId;
    if (!key || !evt.cost) continue;
    const existing = result.get(key) ?? emptySummary();
    result.set(key, mergeCost(existing, evt));
  }
  return result;
}
