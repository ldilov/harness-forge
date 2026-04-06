import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { EventEnvelope } from '../../domain/observability/events/event-envelope.js';
import type { CompactionLevel } from '../../domain/compaction/compaction-level.js';
import { LEVEL_NUMBER } from '../../domain/compaction/compaction-level.js';
import type { CompactionManifest } from '../../domain/compaction/compaction-manifest.js';
import type { SessionSummary } from '../../domain/compaction/session-summary.js';
import type { DeltaSummary } from '../../domain/compaction/delta-summary.js';
import type { ActiveContext } from '../../domain/compaction/active-context.js';
import type { TurnImportanceItem } from '../../domain/compaction/turn-importance.js';
import { generateId } from '../../shared/id-generator.js';
import { nowISO } from '../../shared/timestamps.js';
import type { BehaviorEventEmitter } from '../behavior/behavior-event-emitter.js';
import { classifyItem } from './turn-classifier.js';
import { applyTrim } from './strategies/trim-strategy.js';
import { applySummarize } from './strategies/summarize-strategy.js';
import { validateCompaction } from './validation-gate.js';

interface CompactOptions {
  level: CompactionLevel;
  events: readonly EventEnvelope[];
  objective: string;
  acceptedPlan: string[];
  decisions: ReadonlyArray<{ id: string; title: string; rationale: string }>;
  unresolved: string[];
  artifacts: string[];
  taskId?: string;
  runtimeSessionId?: string;
}

export class CompactionService {
  private readonly basePath: string;
  private readonly emitter?: BehaviorEventEmitter;

  constructor(basePath: string = '.hforge/runtime/context', emitter?: BehaviorEventEmitter) {
    this.basePath = basePath;
    this.emitter = emitter;
  }

  async compact(options: CompactOptions): Promise<CompactionManifest> {
    const {
      level,
      events,
      objective,
      acceptedPlan,
      decisions,
      unresolved,
      artifacts,
      taskId,
      runtimeSessionId,
    } = options;

    const startTime = Date.now();

    this.emitter?.emitCompactionTriggered({
      level,
      estimatedEvents: events.length,
    }, { taskId, correlationId: runtimeSessionId });

    const classified = events.map((evt) =>
      classifyItem({
        id: evt.eventId,
        type: evt.eventType,
        importance: evt.importance,
        isCanonical: true,
      }),
    );

    this.emitter?.emitCompactionStrategySelected({
      strategy: level,
      reason: `Manual compaction at level ${level}`,
      triggerType: 'manual',
      eventsToProcess: classified.length,
    });

    const filtered = this.applyStrategy(level, classified);

    const criticalEventsPreserved = classified
      .filter((item) => item.importance === 'critical')
      .every((critical) => filtered.some((f) => f.id === critical.id));

    const validation = validateCompaction({
      objective,
      acceptedPlan,
      unresolved,
      artifacts,
      criticalEventsPreserved,
    });

    this.emitter?.emitCompactionValidationCompleted({
      valid: validation.passed,
      criticalEventsPreserved,
      tokenReduction: classified.length - filtered.length,
      violations: validation.passed ? [] : validation.failures,
    });

    if (!validation.passed) {
      throw new Error(
        `Compaction validation failed: ${validation.failures.join(', ')}`,
      );
    }

    await mkdir(this.basePath, { recursive: true });

    const now = nowISO();
    const summaryId = generateId('summary');
    const deltaId = generateId('delta');
    const manifestId = generateId('manifest');
    const sessionId = runtimeSessionId ?? 'unknown';

    const firstEvent = events.length > 0 ? events[0] : undefined;
    const lastEvent = events.length > 0 ? events[events.length - 1] : undefined;
    const coveredEventRange: [string, string] = [
      firstEvent?.eventId ?? '',
      lastEvent?.eventId ?? '',
    ];

    const sessionSummary: SessionSummary = {
      schemaVersion: '1.0.0',
      summaryId,
      createdAt: now,
      coversEvents: coveredEventRange,
      objective,
      acceptedPlan,
      decisions: decisions.map((d) => ({ id: d.id, title: d.title, rationale: d.rationale })),
      importantFindings: [],
      artifacts,
      unresolved,
    };

    const deltaSummary: DeltaSummary = {
      schemaVersion: '1.0.0',
      deltaId,
      createdAt: now,
      sinceSummaryId: summaryId,
      changes: [],
      newArtifacts: [],
      newBlockers: [],
      status: 'compacted',
    };

    const activeContext: ActiveContext = {
      schemaVersion: '1.0.0',
      objective,
      acceptedPlan,
      latestDeltaRef: deltaId,
      sessionSummaryRef: summaryId,
      targetPosture: {},
      unresolved,
    };

    const summaryPath = join(this.basePath, 'session-summary.json');
    const deltaPath = join(this.basePath, 'delta-summary.json');
    const contextPath = join(this.basePath, 'active-context.json');
    const manifestPath = join(this.basePath, 'compaction-manifest.json');

    const droppedCount = classified.length - filtered.length;
    const lowCount = classified.filter((i) => i.importance === 'low').length;
    const mediumDropped = droppedCount - Math.min(droppedCount, lowCount);
    const criticalCount = classified.filter((i) => i.importance === 'critical').length;

    const manifest: CompactionManifest = {
      schemaVersion: '1.0.0',
      manifestId,
      createdAt: now,
      source: {
        runtimeSessionId: sessionId,
        taskId,
        coveredEventRange,
      },
      strategy: {
        level: LEVEL_NUMBER[level],
        reason: `Manual compaction at level ${level}`,
        profile: 'default',
      },
      stats: {
        estimatedTokensBefore: classified.length * 100,
        estimatedTokensAfter: filtered.length * 100,
        droppedLowImportanceItems: Math.min(droppedCount, lowCount),
        summarizedMediumImportanceItems: mediumDropped,
        preservedCriticalItems: criticalCount,
      },
      outputs: {
        sessionSummary: summaryPath,
        deltaSummary: deltaPath,
        activeContext: contextPath,
      },
      validation: {
        passed: validation.passed,
        checks: [...validation.checks],
      },
    };

    await Promise.all([
      writeFile(summaryPath, JSON.stringify(sessionSummary, null, 2), 'utf-8'),
      writeFile(deltaPath, JSON.stringify(deltaSummary, null, 2), 'utf-8'),
      writeFile(contextPath, JSON.stringify(activeContext, null, 2), 'utf-8'),
      writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8'),
    ]);

    this.emitter?.emitCompaction({
      tokensBeforeAfter: {
        before: manifest.stats.estimatedTokensBefore,
        after: manifest.stats.estimatedTokensAfter,
      },
      level,
      durationMs: Date.now() - startTime,
      droppedItems: manifest.stats.droppedLowImportanceItems,
      preservedCritical: manifest.stats.preservedCriticalItems,
    }, { taskId, correlationId: runtimeSessionId });

    this.emitter?.emitContextSummary({
      summaryId,
      coveredEventRange,
    }, { taskId });

    this.emitter?.emitContextDelta({
      deltaId,
      sinceSummaryId: summaryId,
    }, { taskId });

    return manifest;
  }

  private applyStrategy(
    level: CompactionLevel,
    items: readonly TurnImportanceItem[],
  ): TurnImportanceItem[] {
    switch (level) {
      case 'trim':
        return applyTrim(items);
      case 'summarize':
      case 'rollup':
      case 'rollover':
        return applySummarize(items);
      case 'none':
      default:
        return [...items];
    }
  }
}
