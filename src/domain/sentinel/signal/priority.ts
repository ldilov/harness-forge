import type { Severity } from "../monitor/monitor.js";

const SEVERITY_WEIGHT: Readonly<Record<Severity, number>> = {
  info: 5,
  notice: 25,
  warning: 55,
  critical: 80,
};

export interface PriorityInputs {
  readonly severity: Severity;
  readonly confidence: number;
  readonly occurrenceCount: number;
  readonly ageMs: number;
}

function severityWeight(severity: Severity): number {
  const value = SEVERITY_WEIGHT[severity];
  return value === undefined ? 0 : value;
}

function confidenceWeight(confidence: number): number {
  return Math.round(Math.max(0, Math.min(1, confidence)) * 10);
}

function recurrenceWeight(occurrenceCount: number): number {
  if (occurrenceCount <= 1) {
    return 0;
  }
  return Math.min(10, Math.floor(Math.log2(occurrenceCount) * 3));
}

function freshnessWeight(ageMs: number): number {
  const hours = Math.max(0, ageMs) / 3_600_000;
  if (hours <= 1) {
    return 5;
  }
  if (hours <= 24) {
    return 3;
  }
  if (hours <= 24 * 7) {
    return 1;
  }
  return 0;
}

export function computePriority(inputs: PriorityInputs): number {
  const value =
    severityWeight(inputs.severity) +
    confidenceWeight(inputs.confidence) +
    recurrenceWeight(inputs.occurrenceCount) +
    freshnessWeight(inputs.ageMs);
  return Math.max(0, Math.min(100, value));
}
