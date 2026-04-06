import path from 'node:path';
import fs from 'node:fs/promises';

import type { InsightPattern } from '../../domain/loop/insight-pattern.js';
import type { BehaviorEventEmitter } from '../behavior/behavior-event-emitter.js';
import {
  type TunableParameter,
  type TuningRecord,
  TuningRecordSchema,
  TUNING_BOUNDS,
} from '../../domain/loop/tuning-record.js';
import { readJsonFile, writeJsonFile, exists, ensureDir } from '../../shared/fs.js';
import { appendNdjson } from '../../infrastructure/events/ndjson-writer.js';
import { generateId } from '../../shared/id-generator.js';
import {
  RUNTIME_DIR,
  RUNTIME_TUNING_LOG_FILE,
  RUNTIME_USER_LOCKS_FILE,
  RUNTIME_INSIGHTS_DIR,
  RUNTIME_CONTEXT_BUDGET_FILE,
  RUNTIME_MEMORY_POLICY_FILE,
  LOOP_CONFIDENCE_SUGGEST,
  LOOP_ROLLBACK_WINDOW,
} from '../../shared/constants.js';
import { readScores } from './trace-store.js';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function tuningLogPath(workspaceRoot: string): string {
  return path.join(workspaceRoot, RUNTIME_DIR, RUNTIME_INSIGHTS_DIR, RUNTIME_TUNING_LOG_FILE);
}

function userLocksPath(workspaceRoot: string): string {
  return path.join(workspaceRoot, RUNTIME_DIR, RUNTIME_USER_LOCKS_FILE);
}

/** Map a TunableParameter to the config file + JSON field path it controls. */
function parameterConfigMapping(
  workspaceRoot: string,
  param: TunableParameter,
): { filePath: string; fieldPath: readonly string[] } {
  const runtimeDir = path.join(workspaceRoot, RUNTIME_DIR);

  switch (param) {
    case 'compaction_trigger_threshold':
      return {
        filePath: path.join(runtimeDir, RUNTIME_CONTEXT_BUDGET_FILE),
        fieldPath: ['thresholds', 'evaluateAt'],
      };
    case 'memory_rotation_cap':
      return {
        filePath: path.join(runtimeDir, RUNTIME_MEMORY_POLICY_FILE),
        fieldPath: ['maxTokens'],
      };
    case 'preferred_compaction_strategy':
      return {
        filePath: path.join(runtimeDir, RUNTIME_CONTEXT_BUDGET_FILE),
        fieldPath: ['preferredStrategy'],
      };
    case 'subagent_brief_length':
      return {
        filePath: path.join(runtimeDir, 'subagents', 'default-brief-policy.json'),
        fieldPath: ['maxBriefLength'],
      };
    case 'load_order_priority':
      return {
        filePath: path.join(runtimeDir, 'load-order.json'),
        fieldPath: ['defaultPriority'],
      };
    case 'output_profile_default':
      return {
        filePath: path.join(runtimeDir, 'output-profile.json'),
        fieldPath: ['defaultProfile'],
      };
  }
}

/** Read a deeply nested field from a JSON object using a field path. */
function getNestedField(obj: Record<string, unknown>, fieldPath: readonly string[]): unknown {
  let current: unknown = obj;
  for (const key of fieldPath) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

/** Set a deeply nested field on a JSON object, returning a new object. */
function setNestedField(
  obj: Record<string, unknown>,
  fieldPath: readonly string[],
  value: unknown,
): Record<string, unknown> {
  if (fieldPath.length === 0) {
    return obj;
  }

  const [head, ...rest] = fieldPath;
  const headKey = head!;
  if (rest.length === 0) {
    return { ...obj, [headKey]: value };
  }

  const child = (typeof obj[headKey] === 'object' && obj[headKey] !== null)
    ? { ...(obj[headKey] as Record<string, unknown>) }
    : {};
  return { ...obj, [headKey]: setNestedField(child, rest, value) };
}

async function isUserLocked(workspaceRoot: string, param: TunableParameter): Promise<boolean> {
  const locksFile = userLocksPath(workspaceRoot);
  if (!(await exists(locksFile))) {
    return false;
  }
  const locks = await readJsonFile<string[]>(locksFile);
  return locks.includes(param);
}

async function readConfigValue(
  workspaceRoot: string,
  param: TunableParameter,
): Promise<unknown> {
  const { filePath, fieldPath } = parameterConfigMapping(workspaceRoot, param);
  if (!(await exists(filePath))) {
    return TUNING_BOUNDS[param].default;
  }
  const config = await readJsonFile<Record<string, unknown>>(filePath);
  const value = getNestedField(config, fieldPath);
  return value ?? TUNING_BOUNDS[param].default;
}

async function writeConfigValue(
  workspaceRoot: string,
  param: TunableParameter,
  value: unknown,
): Promise<void> {
  const { filePath, fieldPath } = parameterConfigMapping(workspaceRoot, param);
  let config: Record<string, unknown> = {};
  if (await exists(filePath)) {
    config = await readJsonFile<Record<string, unknown>>(filePath);
  }
  const updated = setNestedField(config, fieldPath, value);
  await writeJsonFile(filePath, updated);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Apply tunings for patterns whose confidence meets the threshold and that
 * carry an actionable recommendation with a recognized parameter name.
 * Accepts an optional emitter to emit loop.tuning.applied after each tuning.
 */
export async function applyTunings(
  workspaceRoot: string,
  patterns: readonly InsightPattern[],
  emitter?: BehaviorEventEmitter,
): Promise<readonly TuningRecord[]> {
  const applied: TuningRecord[] = [];

  for (const pattern of patterns) {
    if (pattern.confidence < LOOP_CONFIDENCE_SUGGEST) {
      continue;
    }
    if (!pattern.recommendation) {
      continue;
    }

    const paramRaw = pattern.recommendation.params['parameter'] as string | undefined;
    if (!paramRaw) {
      continue;
    }

    const parseResult = TUNING_BOUNDS[paramRaw as TunableParameter];
    if (!parseResult) {
      continue;
    }
    const param = paramRaw as TunableParameter;

    if (await isUserLocked(workspaceRoot, param)) {
      continue;
    }

    const newValueRaw = pattern.recommendation.params['value'];
    if (newValueRaw === undefined) {
      continue;
    }
    const newValue = Number(newValueRaw);
    if (Number.isNaN(newValue)) {
      continue;
    }

    const bounds = TUNING_BOUNDS[param];
    const clampedValue = Math.max(bounds.min, Math.min(bounds.max, newValue));

    const previousValue = await readConfigValue(workspaceRoot, param);
    await writeConfigValue(workspaceRoot, param, clampedValue);

    const record: TuningRecord = {
      id: generateId('tuning'),
      parameter: param,
      previousValue,
      newValue: clampedValue,
      triggeringPatternId: pattern.id,
      appliedAt: new Date().toISOString(),
      rolledBack: false,
    };

    await appendNdjson(tuningLogPath(workspaceRoot), record);
    applied.push(record);

    emitter?.emitLoopTuningApplied({
      tuningId: record.id,
      parameter: record.parameter,
      oldValue: record.previousValue,
      newValue: record.newValue,
    });
  }

  return applied;
}

/**
 * Check recent scores against pre-tuning scores. If tunings caused a
 * regression (avg score dropped), revert them automatically.
 */
export async function checkRollback(workspaceRoot: string): Promise<readonly TuningRecord[]> {
  const allScores = await readScores(workspaceRoot);
  if (allScores.length < LOOP_ROLLBACK_WINDOW) {
    return [];
  }

  const recentScores = allScores.slice(0, LOOP_ROLLBACK_WINDOW);
  const avgRecent = recentScores.reduce((sum, s) => sum + s.score, 0) / recentScores.length;

  const olderScores = allScores.slice(LOOP_ROLLBACK_WINDOW);
  if (olderScores.length === 0) {
    return [];
  }
  const avgOlder = olderScores.reduce((sum, s) => sum + s.score, 0) / olderScores.length;

  if (avgRecent >= avgOlder) {
    return [];
  }

  // Scores regressed — revert recent non-reverted tunings
  const tunings = await listTunings(workspaceRoot);
  const reverted: TuningRecord[] = [];

  for (const tuning of tunings) {
    if (tuning.rolledBack) {
      continue;
    }
    const result = await revertTuning(workspaceRoot, tuning.id);
    if (result) {
      reverted.push(result);
    }
  }

  return reverted;
}

/**
 * Revert a single tuning by its ID: restore the previous config value
 * and mark the record as rolled back.
 * Accepts an optional emitter to emit loop.tuning.reverted after rollback.
 */
export async function revertTuning(
  workspaceRoot: string,
  tuningId: string,
  emitter?: BehaviorEventEmitter,
): Promise<TuningRecord | null> {
  const tunings = await listTunings(workspaceRoot);
  const target = tunings.find((t) => t.id === tuningId);
  if (!target || target.rolledBack) {
    return null;
  }

  await writeConfigValue(workspaceRoot, target.parameter, target.previousValue);

  const updated: TuningRecord = {
    ...target,
    rolledBack: true,
    rolledBackAt: new Date().toISOString(),
  };

  await appendNdjson(tuningLogPath(workspaceRoot), updated);

  emitter?.emitLoopTuningReverted({
    tuningId: updated.id,
    parameter: updated.parameter,
  });

  return updated;
}

/**
 * Read all tuning records from the NDJSON log.
 * Later entries for the same ID override earlier ones (last-write-wins).
 */
export async function listTunings(workspaceRoot: string): Promise<readonly TuningRecord[]> {
  const logFile = tuningLogPath(workspaceRoot);
  if (!(await exists(logFile))) {
    return [];
  }

  const content = await fs.readFile(logFile, 'utf-8');
  const lines = content.split('\n').filter((l) => l.trim().length > 0);
  const byId = new Map<string, TuningRecord>();

  for (const line of lines) {
    const parsed = TuningRecordSchema.safeParse(JSON.parse(line));
    if (parsed.success) {
      byId.set(parsed.data.id, parsed.data);
    }
  }

  return [...byId.values()];
}

/**
 * Remove a parameter from the user-locks list, allowing the tuner to
 * modify it again.
 */
export async function unlockParameter(
  workspaceRoot: string,
  param: TunableParameter,
): Promise<void> {
  const locksFile = userLocksPath(workspaceRoot);
  if (!(await exists(locksFile))) {
    return;
  }
  const locks = await readJsonFile<string[]>(locksFile);
  const updated = locks.filter((l) => l !== param);
  await writeJsonFile(locksFile, updated);
}

/**
 * Add a parameter to the user-locks list, preventing the tuner from
 * modifying it.
 */
export async function lockParameter(
  workspaceRoot: string,
  param: TunableParameter,
): Promise<void> {
  const locksFile = userLocksPath(workspaceRoot);
  await ensureDir(path.dirname(locksFile));
  let locks: string[] = [];
  if (await exists(locksFile)) {
    locks = await readJsonFile<string[]>(locksFile);
  }
  if (!locks.includes(param)) {
    locks = [...locks, param];
  }
  await writeJsonFile(locksFile, locks);
}
