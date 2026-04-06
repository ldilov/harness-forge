import { z } from 'zod';

export const TunableParameter = z.enum([
  'compaction_trigger_threshold',
  'preferred_compaction_strategy',
  'memory_rotation_cap',
  'subagent_brief_length',
  'load_order_priority',
  'output_profile_default',
]);
export type TunableParameter = z.infer<typeof TunableParameter>;

export const TuningBoundsSchema = z.object({
  parameter: TunableParameter,
  min: z.number(),
  max: z.number(),
  default: z.number(),
});
export type TuningBounds = z.infer<typeof TuningBoundsSchema>;

export const TUNING_BOUNDS: Record<TunableParameter, TuningBounds> = {
  compaction_trigger_threshold: { parameter: 'compaction_trigger_threshold', min: 0.50, max: 0.90, default: 0.70 },
  preferred_compaction_strategy: { parameter: 'preferred_compaction_strategy', min: 0, max: 4, default: 0 },
  memory_rotation_cap: { parameter: 'memory_rotation_cap', min: 1000, max: 100000, default: 50000 },
  subagent_brief_length: { parameter: 'subagent_brief_length', min: 100, max: 5000, default: 1000 },
  load_order_priority: { parameter: 'load_order_priority', min: 0, max: 100, default: 50 },
  output_profile_default: { parameter: 'output_profile_default', min: 0, max: 3, default: 1 },
};

export const TuningRecordSchema = z.object({
  id: z.string(),
  parameter: TunableParameter,
  previousValue: z.unknown(),
  newValue: z.unknown(),
  triggeringPatternId: z.string(),
  appliedAt: z.string(),
  rolledBack: z.boolean().default(false),
  rolledBackAt: z.string().optional(),
});
export type TuningRecord = z.infer<typeof TuningRecordSchema>;
