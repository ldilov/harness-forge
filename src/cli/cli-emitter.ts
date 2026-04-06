import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { BehaviorEventEmitter } from '../application/behavior/behavior-event-emitter.js';
import { createPersistenceListener, createNdjsonPersistenceListener } from '../application/behavior/event-persistence-listener.js';
import { SessionRecorder } from '../application/loop/session-recorder.js';
import { scoreSession } from '../application/loop/effectiveness-scorer.js';
import { writeTrace, appendScore, countTracesSinceLastExtraction } from '../application/loop/trace-store.js';
import { extractPatterns } from '../application/loop/pattern-extractor.js';
import { savePatterns, shouldExtract } from '../application/loop/insight-store.js';
import { applyTunings } from '../application/loop/policy-tuner.js';
import { OBSERVABILITY_DIR, OBSERVABILITY_EVENTS_FILE } from '../shared/index.js';

export const cliSessionId = `cli_${randomBytes(8).toString('hex')}`;
export const cliEmitter = new BehaviorEventEmitter(cliSessionId);

let resolvedWorkspaceRoot = process.cwd();
let recorder: SessionRecorder | null = null;

export function setWorkspaceRoot(root: string): void {
  resolvedWorkspaceRoot = path.resolve(root);
}

export function initSessionRecorder(sessionId: string, target: string, repo: string): void {
  recorder = new SessionRecorder(sessionId, target, repo);
  cliEmitter.onEvent((event) => recorder?.recordEvent(event));
}

export async function finalizeSessionTrace(): Promise<void> {
  if (recorder === null) {
    return;
  }

  const trace = recorder.buildTrace();
  const score = scoreSession(trace);

  await writeTrace(resolvedWorkspaceRoot, trace);
  await appendScore(resolvedWorkspaceRoot, score);

  // Emit loop.trace.recorded event
  cliEmitter.emitLoopTraceRecorded({ traceId: trace.traceId, score: score.score });

  recorder = null;

  // Auto-trigger pattern extraction after N sessions
  const traceCount = await countTracesSinceLastExtraction(resolvedWorkspaceRoot);
  if (shouldExtract(traceCount)) {
    const patterns = await extractPatterns(resolvedWorkspaceRoot, cliEmitter);
    await savePatterns(resolvedWorkspaceRoot, patterns);
    cliEmitter.emitLoopPatternExtracted({ patternCount: patterns.length, newPatterns: patterns.length });

    // Auto-apply tunings from high-confidence patterns
    const tunings = await applyTunings(resolvedWorkspaceRoot, patterns, cliEmitter);
    for (const tuning of tunings) {
      cliEmitter.emitLoopTuningApplied({
        tuningId: tuning.id,
        parameter: tuning.parameter,
        oldValue: tuning.previousValue,
        newValue: tuning.newValue,
      });
    }
  }
}

function getEventsJsonPath(): string {
  return path.join(resolvedWorkspaceRoot, OBSERVABILITY_DIR, OBSERVABILITY_EVENTS_FILE);
}

function getEventsNdjsonPath(): string {
  return path.join(resolvedWorkspaceRoot, OBSERVABILITY_DIR, 'events.ndjson');
}

cliEmitter.onEvent(createPersistenceListener(getEventsJsonPath));
cliEmitter.onEvent(createNdjsonPersistenceListener(getEventsNdjsonPath));
