interface ShapeMetrics {
  readonly duplicateRetrievalCount?: number;
  readonly repeatedRestatementCount?: number;
  readonly lowImportanceEventCount?: number;
  readonly recursiveDepth?: number;
  readonly narrativeOutputRatio?: number;
}

interface ShapeTriggerResult {
  readonly shouldTrigger: boolean;
  readonly reasons: string[];
}

const THRESHOLDS = {
  duplicateRetrieval: 5,
  repeatedRestatement: 3,
  lowImportanceEvents: 50,
  recursiveDepth: 5,
  narrativeOutputRatio: 0.6,
} as const;

export function evaluateShapeTriggers(metrics: ShapeMetrics): ShapeTriggerResult {
  const reasons: string[] = [];

  if (
    metrics.duplicateRetrievalCount !== undefined &&
    metrics.duplicateRetrievalCount > THRESHOLDS.duplicateRetrieval
  ) {
    reasons.push(
      `duplicateRetrievalCount (${metrics.duplicateRetrievalCount}) exceeds threshold (${THRESHOLDS.duplicateRetrieval})`,
    );
  }

  if (
    metrics.repeatedRestatementCount !== undefined &&
    metrics.repeatedRestatementCount > THRESHOLDS.repeatedRestatement
  ) {
    reasons.push(
      `repeatedRestatementCount (${metrics.repeatedRestatementCount}) exceeds threshold (${THRESHOLDS.repeatedRestatement})`,
    );
  }

  if (
    metrics.lowImportanceEventCount !== undefined &&
    metrics.lowImportanceEventCount > THRESHOLDS.lowImportanceEvents
  ) {
    reasons.push(
      `lowImportanceEventCount (${metrics.lowImportanceEventCount}) exceeds threshold (${THRESHOLDS.lowImportanceEvents})`,
    );
  }

  if (
    metrics.recursiveDepth !== undefined &&
    metrics.recursiveDepth > THRESHOLDS.recursiveDepth
  ) {
    reasons.push(
      `recursiveDepth (${metrics.recursiveDepth}) exceeds threshold (${THRESHOLDS.recursiveDepth})`,
    );
  }

  if (
    metrics.narrativeOutputRatio !== undefined &&
    metrics.narrativeOutputRatio > THRESHOLDS.narrativeOutputRatio
  ) {
    reasons.push(
      `narrativeOutputRatio (${metrics.narrativeOutputRatio}) exceeds threshold (${THRESHOLDS.narrativeOutputRatio})`,
    );
  }

  return { shouldTrigger: reasons.length > 0, reasons };
}
