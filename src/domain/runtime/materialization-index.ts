import { z } from "zod";

export const materializationEntrySchema = z.object({
  bundleId: z.string().min(1),
  destinationPath: z.string().min(1),
  operationType: z.string().min(1),
  sourcePath: z.string().min(1).optional()
});

export const materializationIndexDocumentSchema = z.object({
  generatedAt: z.string().min(1),
  entries: z.array(materializationEntrySchema)
});

export type MaterializationEntry = z.infer<typeof materializationEntrySchema>;
export type MaterializationIndexDocument = z.infer<typeof materializationIndexDocumentSchema>;

export function parseMaterializationIndexDocument(value: unknown): MaterializationIndexDocument {
  return materializationIndexDocumentSchema.parse(value);
}
