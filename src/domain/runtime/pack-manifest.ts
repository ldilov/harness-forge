import { z } from "zod";

export const packSelectionModeSchema = z.enum(["default", "recommended", "explicit", "profile"]);
export const packSupportLevelSchema = z.enum(["full", "partial", "emulated", "unsupported"]);

export const packManifestSchema = z.object({
  packId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  kind: z.string().min(1),
  sourceBundleIds: z.array(z.string().min(1)).min(1),
  dependsOn: z.array(z.string().min(1)).default([]),
  conflictsWith: z.array(z.string().min(1)).default([]),
  managedRoots: z.array(z.string().min(1)).min(1),
  selectionMode: packSelectionModeSchema,
  optional: z.boolean().default(true),
  defaultEnabled: z.boolean().default(false),
  targetPosture: z.record(packSupportLevelSchema).default({})
});

export type PackSelectionMode = z.infer<typeof packSelectionModeSchema>;
export type PackManifest = z.infer<typeof packManifestSchema>;

export function parsePackManifest(value: unknown): PackManifest {
  return packManifestSchema.parse(value);
}
