import { describe, it, expect } from 'vitest';
import {
  TunableParameter,
  TuningBoundsSchema,
  TuningRecordSchema,
  TUNING_BOUNDS,
  type TuningRecord,
  type TuningBounds,
} from '@domain/loop/tuning-record.js';

const validRecord: TuningRecord = {
  id: 'tun_abc123',
  parameter: 'compaction_trigger_threshold',
  previousValue: 0.70,
  newValue: 0.80,
  triggeringPatternId: 'pat_xyz789',
  appliedAt: '2026-04-06T14:00:00Z',
  rolledBack: false,
};

describe('TuningRecord contract', () => {
  it('parses a valid tuning record', () => {
    const result = TuningRecordSchema.parse(validRecord);
    expect(result).toEqual(validRecord);
  });

  it('TunableParameter has exactly 6 enum values', () => {
    const values = TunableParameter.options;
    expect(values).toHaveLength(6);
    expect(values).toContain('compaction_trigger_threshold');
    expect(values).toContain('preferred_compaction_strategy');
    expect(values).toContain('memory_rotation_cap');
    expect(values).toContain('subagent_brief_length');
    expect(values).toContain('load_order_priority');
    expect(values).toContain('output_profile_default');
  });

  it('rejects unknown parameter values', () => {
    expect(() =>
      TuningRecordSchema.parse({ ...validRecord, parameter: 'unknown_param' }),
    ).toThrow();
  });

  it('rolledBack defaults to false', () => {
    const { rolledBack: _, ...withoutRolledBack } = validRecord;
    const result = TuningRecordSchema.parse(withoutRolledBack);
    expect(result.rolledBack).toBe(false);
  });

  it('rolledBackAt is optional', () => {
    const result = TuningRecordSchema.parse(validRecord);
    expect(result.rolledBackAt).toBeUndefined();
  });

  it('accepts rolledBackAt when rolledBack is true', () => {
    const reverted: TuningRecord = {
      ...validRecord,
      rolledBack: true,
      rolledBackAt: '2026-04-06T16:00:00Z',
    };
    const result = TuningRecordSchema.parse(reverted);
    expect(result.rolledBack).toBe(true);
    expect(result.rolledBackAt).toBe('2026-04-06T16:00:00Z');
  });

  it('rejects missing required fields', () => {
    const { id: _, ...missingId } = validRecord;
    expect(() => TuningRecordSchema.parse(missingId)).toThrow();

    const { parameter: __, ...missingParam } = validRecord;
    expect(() => TuningRecordSchema.parse(missingParam)).toThrow();

    const { triggeringPatternId: ___, ...missingPatternId } = validRecord;
    expect(() => TuningRecordSchema.parse(missingPatternId)).toThrow();

    const { appliedAt: ____, ...missingAppliedAt } = validRecord;
    expect(() => TuningRecordSchema.parse(missingAppliedAt)).toThrow();
  });

  it('TUNING_BOUNDS has an entry for every TunableParameter', () => {
    for (const param of TunableParameter.options) {
      expect(TUNING_BOUNDS[param]).toBeDefined();
      expect(TUNING_BOUNDS[param].parameter).toBe(param);
      expect(TUNING_BOUNDS[param].min).toBeLessThanOrEqual(TUNING_BOUNDS[param].max);
      expect(TUNING_BOUNDS[param].default).toBeGreaterThanOrEqual(TUNING_BOUNDS[param].min);
      expect(TUNING_BOUNDS[param].default).toBeLessThanOrEqual(TUNING_BOUNDS[param].max);
    }
  });

  it('TuningBoundsSchema validates bounds shape', () => {
    const bounds: TuningBounds = {
      parameter: 'memory_rotation_cap',
      min: 1000,
      max: 100000,
      default: 50000,
    };
    const result = TuningBoundsSchema.parse(bounds);
    expect(result).toEqual(bounds);
  });

  it('previousValue and newValue accept any JSON-serializable value', () => {
    const withString = TuningRecordSchema.parse({
      ...validRecord,
      previousValue: 'strategy-a',
      newValue: 'strategy-b',
    });
    expect(withString.previousValue).toBe('strategy-a');

    const withNull = TuningRecordSchema.parse({
      ...validRecord,
      previousValue: null,
      newValue: 42,
    });
    expect(withNull.previousValue).toBeNull();
  });
});
