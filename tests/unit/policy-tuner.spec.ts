import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

import {
  applyTunings,
  checkRollback,
  revertTuning,
  listTunings,
  unlockParameter,
  lockParameter,
} from '@app/loop/policy-tuner.js';
import type { InsightPattern } from '@domain/loop/insight-pattern.js';
import { RUNTIME_DIR, RUNTIME_INSIGHTS_DIR, RUNTIME_TUNING_LOG_FILE, RUNTIME_USER_LOCKS_FILE } from '@shared/constants.js';
import { writeJsonFile } from '@shared/fs.js';
import { appendNdjson } from '@infra/events/ndjson-writer.js';

let tmpDir: string;

function tuningLogPath(): string {
  return path.join(tmpDir, RUNTIME_DIR, RUNTIME_INSIGHTS_DIR, RUNTIME_TUNING_LOG_FILE);
}

function userLocksPath(): string {
  return path.join(tmpDir, RUNTIME_DIR, RUNTIME_USER_LOCKS_FILE);
}

function makePattern(overrides: Partial<InsightPattern> = {}): InsightPattern {
  return {
    id: 'pat_test001',
    type: 'budget_sweet_spot',
    confidence: 0.85,
    sampleSize: 10,
    discoveredAt: '2026-04-06T10:00:00Z',
    lastValidated: '2026-04-06T10:00:00Z',
    finding: 'Threshold should be higher',
    evidence: {},
    recommendation: {
      action: 'adjust_parameter',
      params: { parameter: 'compaction_trigger_threshold', value: 0.80 },
      impact: 'Reduces unnecessary compactions',
    },
    ...overrides,
  };
}

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'policy-tuner-'));
  await fs.mkdir(path.join(tmpDir, RUNTIME_DIR, RUNTIME_INSIGHTS_DIR), { recursive: true });
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('policy-tuner', () => {
  describe('applyTunings', () => {
    it('applies a tuning when confidence meets threshold', async () => {
      const pattern = makePattern();
      const result = await applyTunings(tmpDir, [pattern]);
      expect(result).toHaveLength(1);
      expect(result[0]!.parameter).toBe('compaction_trigger_threshold');
      expect(result[0]!.newValue).toBe(0.80);
      expect(result[0]!.rolledBack).toBe(false);
    });

    it('skips patterns with confidence below threshold', async () => {
      const pattern = makePattern({ confidence: 0.5 });
      const result = await applyTunings(tmpDir, [pattern]);
      expect(result).toHaveLength(0);
    });

    it('skips patterns without recommendation', async () => {
      const pattern = makePattern({ recommendation: undefined });
      const result = await applyTunings(tmpDir, [pattern]);
      expect(result).toHaveLength(0);
    });

    it('skips user-locked parameters', async () => {
      await writeJsonFile(userLocksPath(), ['compaction_trigger_threshold']);
      const pattern = makePattern();
      const result = await applyTunings(tmpDir, [pattern]);
      expect(result).toHaveLength(0);
    });

    it('clamps values to bounds', async () => {
      const pattern = makePattern({
        recommendation: {
          action: 'adjust_parameter',
          params: { parameter: 'compaction_trigger_threshold', value: 0.99 },
          impact: 'Out of bounds',
        },
      });
      const result = await applyTunings(tmpDir, [pattern]);
      expect(result).toHaveLength(1);
      expect(result[0]!.newValue).toBe(0.90); // clamped to max
    });

    it('persists tuning records to NDJSON log', async () => {
      const pattern = makePattern();
      await applyTunings(tmpDir, [pattern]);

      const content = await fs.readFile(tuningLogPath(), 'utf-8');
      const lines = content.split('\n').filter((l) => l.trim().length > 0);
      expect(lines).toHaveLength(1);

      const record = JSON.parse(lines[0]!);
      expect(record.parameter).toBe('compaction_trigger_threshold');
    });

    it('writes config value to the mapped file', async () => {
      const pattern = makePattern();
      await applyTunings(tmpDir, [pattern]);

      const configPath = path.join(tmpDir, RUNTIME_DIR, 'context-budget.json');
      const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
      expect(config.thresholds.evaluateAt).toBe(0.80);
    });
  });

  describe('listTunings', () => {
    it('returns empty array when no log exists', async () => {
      const result = await listTunings(tmpDir);
      expect(result).toEqual([]);
    });

    it('deduplicates by id (last-write-wins)', async () => {
      const logFile = tuningLogPath();
      await appendNdjson(logFile, {
        id: 'tun_001',
        parameter: 'memory_rotation_cap',
        previousValue: 50000,
        newValue: 60000,
        triggeringPatternId: 'pat_x',
        appliedAt: '2026-04-06T10:00:00Z',
        rolledBack: false,
      });
      await appendNdjson(logFile, {
        id: 'tun_001',
        parameter: 'memory_rotation_cap',
        previousValue: 50000,
        newValue: 60000,
        triggeringPatternId: 'pat_x',
        appliedAt: '2026-04-06T10:00:00Z',
        rolledBack: true,
        rolledBackAt: '2026-04-06T12:00:00Z',
      });

      const result = await listTunings(tmpDir);
      expect(result).toHaveLength(1);
      expect(result[0]!.rolledBack).toBe(true);
    });
  });

  describe('revertTuning', () => {
    it('reverts a tuning and restores previous value', async () => {
      const pattern = makePattern();
      const [applied] = await applyTunings(tmpDir, [pattern]);
      const reverted = await revertTuning(tmpDir, applied!.id);

      expect(reverted).not.toBeNull();
      expect(reverted!.rolledBack).toBe(true);
      expect(reverted!.rolledBackAt).toBeDefined();

      // Config should be restored
      const configPath = path.join(tmpDir, RUNTIME_DIR, 'context-budget.json');
      const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
      expect(config.thresholds.evaluateAt).toBe(applied!.previousValue);
    });

    it('returns null for non-existent tuning id', async () => {
      const result = await revertTuning(tmpDir, 'tun_nonexistent');
      expect(result).toBeNull();
    });

    it('returns null for already-reverted tuning', async () => {
      const pattern = makePattern();
      const [applied] = await applyTunings(tmpDir, [pattern]);
      await revertTuning(tmpDir, applied!.id);
      // second revert should find the reverted version
      const result = await revertTuning(tmpDir, applied!.id);
      expect(result).toBeNull();
    });
  });

  describe('lockParameter / unlockParameter', () => {
    it('lock prevents tuning, unlock re-enables it', async () => {
      await lockParameter(tmpDir, 'compaction_trigger_threshold');
      const pattern = makePattern();
      const blocked = await applyTunings(tmpDir, [pattern]);
      expect(blocked).toHaveLength(0);

      await unlockParameter(tmpDir, 'compaction_trigger_threshold');
      const allowed = await applyTunings(tmpDir, [pattern]);
      expect(allowed).toHaveLength(1);
    });

    it('unlockParameter is a no-op when locks file does not exist', async () => {
      // Should not throw
      await unlockParameter(tmpDir, 'memory_rotation_cap');
    });
  });

  describe('checkRollback', () => {
    it('returns empty when not enough scores', async () => {
      const result = await checkRollback(tmpDir);
      expect(result).toEqual([]);
    });
  });
});
