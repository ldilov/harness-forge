import { z } from "zod";
import { SeveritySchema } from "../monitor/monitor.js";

export const EvidenceRefSchema = z
  .object({
    kind: z.enum(["file", "command", "api", "log", "trace", "url"]),
    ref: z.string().min(1),
    lineStart: z.number().int().positive().optional(),
    lineEnd: z.number().int().positive().optional(),
    hash: z.string().optional(),
    excerpt: z.string().optional(),
  })
  .strict();
export type EvidenceRef = z.infer<typeof EvidenceRefSchema>;

export const ObservationSchema = z
  .object({
    id: z.string().min(1),
    source: z.string().min(1),
    kind: z.string().min(1),
    severity: SeveritySchema,
    subject: z.string().min(1),
    summary: z.string().min(1),
    evidence: z.array(EvidenceRefSchema).min(1),
    detectedAt: z.string().min(1),
    fingerprint: z.string().min(1),
    confidence: z.number().min(0).max(1),
    occurrenceCount: z.number().int().positive().optional(),
    firstSeenAt: z.string().optional(),
    lastSeenAt: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();
export type Observation = z.infer<typeof ObservationSchema>;

export const FingerprintIndexEntrySchema = z
  .object({
    id: z.string(),
    fingerprint: z.string(),
    occurrenceCount: z.number().int().positive(),
    firstSeenAt: z.string(),
    lastSeenAt: z.string(),
  })
  .strict();
export type FingerprintIndexEntry = z.infer<typeof FingerprintIndexEntrySchema>;

export const FingerprintIndexSchema = z.record(z.string(), FingerprintIndexEntrySchema);
export type FingerprintIndex = z.infer<typeof FingerprintIndexSchema>;

export const MonitorRunRecordSchema = z
  .object({
    monitorId: z.string(),
    startedAt: z.string(),
    endedAt: z.string(),
    durationMs: z.number().int().nonnegative(),
    observationsEmitted: z.number().int().nonnegative(),
    observationsDeduped: z.number().int().nonnegative(),
    errors: z.array(z.string()).default([]),
  })
  .strict();
export type MonitorRunRecord = z.infer<typeof MonitorRunRecordSchema>;
