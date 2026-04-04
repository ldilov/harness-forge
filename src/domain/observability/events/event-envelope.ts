import { z } from 'zod';
import { ImportanceSchema, RetentionTierSchema } from './event-importance.js';

export const ActorInfoSchema = z.object({
  actorType: z.string().min(1),
  actorId: z.string().min(1).optional(),
  label: z.string().optional(),
});
export type ActorInfo = z.infer<typeof ActorInfoSchema>;

export const TargetInfoSchema = z.object({
  targetType: z.string().min(1),
  targetId: z.string().min(1).optional(),
  path: z.string().optional(),
});
export type TargetInfo = z.infer<typeof TargetInfoSchema>;

export const CostInfoSchema = z.object({
  durationMs: z.number().min(0).optional(),
  tokensUsed: z.number().int().min(0).optional(),
  apiCalls: z.number().int().min(0).optional(),
});
export type CostInfo = z.infer<typeof CostInfoSchema>;

export const ArtifactRefSchema = z.object({
  artifactType: z.string().min(1),
  path: z.string().min(1),
  hash: z.string().optional(),
});
export type ArtifactRef = z.infer<typeof ArtifactRefSchema>;

export const EventEnvelopeSchema = z.object({
  eventId: z.string().min(1),
  eventType: z.string().min(1),
  occurredAt: z.string().min(1),
  schemaVersion: z.string().min(1),
  runtimeSessionId: z.string().min(1),
  importance: ImportanceSchema.optional(),
  retentionTier: RetentionTierSchema.optional(),
  category: z.string().optional(),
  taskId: z.string().optional(),
  correlationId: z.string().optional(),
  parentEventId: z.string().optional(),
  actor: ActorInfoSchema.optional(),
  target: TargetInfoSchema.optional(),
  cost: CostInfoSchema.optional(),
  artifacts: z.array(ArtifactRefSchema).optional(),
  payload: z.record(z.unknown()),
  tags: z.array(z.string()).optional(),
});

export type EventEnvelope = z.infer<typeof EventEnvelopeSchema>;
