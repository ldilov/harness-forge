import { z } from "zod";

export const exportProfileManifestSchema = z.object({
  profile: z.string().min(1),
  include: z.array(z.string().min(1)).default([]),
  exclude: z.array(z.string().min(1)).default([]),
  requiredCanonicalPaths: z.array(z.string().min(1)).default([]),
  notes: z.string().optional()
});

export const exportLeakageRecordSchema = z.object({
  profile: z.string().min(1),
  blockedPath: z.string().min(1),
  reason: z.string().min(1)
});

export type ExportProfileManifest = z.infer<typeof exportProfileManifestSchema>;
export type ExportLeakageRecord = z.infer<typeof exportLeakageRecordSchema>;

export function parseExportProfileManifest(value: unknown): ExportProfileManifest {
  return exportProfileManifestSchema.parse(value);
}

export function parseExportLeakageRecord(value: unknown): ExportLeakageRecord {
  return exportLeakageRecordSchema.parse(value);
}
