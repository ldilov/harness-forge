import type { CompactionLevel } from '../../domain/compaction/compaction-level.js';
import { LEVEL_NUMBER } from '../../domain/compaction/compaction-level.js';
import type { ContextBudget } from '../../domain/compaction/context-budget.js';
import { evaluateThreshold } from './triggers/threshold-trigger.js';
import { evaluateShapeTriggers } from './triggers/shape-trigger.js';
import { shouldTriggerAfterWorkflow } from './triggers/workflow-trigger.js';

interface ShapeMetrics {
  readonly duplicateRetrievalCount?: number;
  readonly repeatedRestatementCount?: number;
  readonly lowImportanceEventCount?: number;
  readonly recursiveDepth?: number;
  readonly narrativeOutputRatio?: number;
}

interface TriggerResult {
  readonly level: CompactionLevel;
  readonly reasons: string[];
}

export class TriggerEngine {
  private _running = false;

  async evaluate(
    budget: ContextBudget,
    metrics: ShapeMetrics,
    completedEventType?: string,
  ): Promise<TriggerResult | null> {
    if (this._running) return null;

    const reasons: string[] = [];
    let highestLevel: CompactionLevel = 'none';

    const currentPercentage =
      budget.model.contextWindowTokens > 0
        ? budget.current.estimatedInputTokens / budget.model.contextWindowTokens
        : 0;

    const thresholdLevel = evaluateThreshold(currentPercentage, budget.thresholds);
    if (LEVEL_NUMBER[thresholdLevel] > LEVEL_NUMBER[highestLevel]) {
      highestLevel = thresholdLevel;
      reasons.push(
        `threshold: usage at ${(currentPercentage * 100).toFixed(1)}% triggered ${thresholdLevel}`,
      );
    }

    const shapeResult = evaluateShapeTriggers(metrics);
    if (shapeResult.shouldTrigger) {
      const shapeLevel: CompactionLevel = 'summarize';
      if (LEVEL_NUMBER[shapeLevel] > LEVEL_NUMBER[highestLevel]) {
        highestLevel = shapeLevel;
      }
      reasons.push(...shapeResult.reasons.map((r) => `shape: ${r}`));
    }

    if (completedEventType !== undefined && shouldTriggerAfterWorkflow(completedEventType)) {
      const workflowLevel: CompactionLevel = 'trim';
      if (LEVEL_NUMBER[workflowLevel] > LEVEL_NUMBER[highestLevel]) {
        highestLevel = workflowLevel;
      }
      reasons.push(`workflow: ${completedEventType} completed`);
    }

    if (highestLevel === 'none') return null;

    return { level: highestLevel, reasons };
  }

  setRunning(value: boolean): void {
    this._running = value;
  }
}
