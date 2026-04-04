import { z } from "zod";

export const selectedProfileDocumentSchema = z.object({
  profileId: z.string().min(1),
  displayName: z.string().optional(),
  bundleIds: z.array(z.string().min(1)).default([]),
  generatedAt: z.string().min(1)
});

export type SelectedProfileDocument = z.infer<typeof selectedProfileDocumentSchema>;

export function parseSelectedProfileDocument(value: unknown): SelectedProfileDocument {
  return selectedProfileDocumentSchema.parse(value);
}
