import { z } from "zod";

import { packSelectionModeSchema } from "./pack-manifest.js";

export const installedPackItemSchema = z.object({
  packId: z.string().min(1),
  selectedBy: packSelectionModeSchema,
  sourceBundleIds: z.array(z.string().min(1)).min(1)
});

export const installedPacksDocumentSchema = z.object({
  runtimeSchemaVersion: z.number(),
  packageVersion: z.string().min(1),
  profileId: z.string().min(1).optional(),
  packs: z.array(installedPackItemSchema)
});

export type InstalledPackItem = z.infer<typeof installedPackItemSchema>;
export type InstalledPacksDocument = z.infer<typeof installedPacksDocumentSchema>;

export function parseInstalledPacksDocument(value: unknown): InstalledPacksDocument {
  return installedPacksDocumentSchema.parse(value);
}
