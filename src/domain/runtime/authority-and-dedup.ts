import { z } from "zod";

export const surfaceTierSchema = z.enum(["hot", "warm", "cold"]);

export const conceptAuthorityRecordSchema = z.object({
  conceptId: z.string().min(1),
  canonicalPath: z.string().min(1),
  aliases: z.array(z.string().min(1)).default([]),
  projections: z.array(z.string().min(1)).default([]),
  tier: surfaceTierSchema,
  indexPriority: z.string().optional(),
  contentHash: z.string().optional(),
  reasonToLoad: z.string().optional(),
  reasonToAvoid: z.string().optional()
});

export const authorityMapDocumentSchema = z.object({
  schemaVersion: z.string().min(1),
  generatedAt: z.string().min(1),
  concepts: z.array(conceptAuthorityRecordSchema)
});

export const duplicateInventoryGroupSchema = z.object({
  groupId: z.string().min(1),
  conceptId: z.string().min(1),
  canonicalPath: z.string().min(1),
  duplicatePaths: z.array(z.string().min(1)),
  duplicateType: z.enum(["exact", "near"]),
  similarityScore: z.number().min(0).max(1).optional(),
  estimatedRepeatedTokens: z.number().min(0).default(0),
  recommendedAction: z.string().optional()
});

export const duplicateInventoryDocumentSchema = z.object({
  generatedAt: z.string().min(1),
  duplicateGroups: z.array(duplicateInventoryGroupSchema)
});

export type SurfaceTier = z.infer<typeof surfaceTierSchema>;
export type ConceptAuthorityRecord = z.infer<typeof conceptAuthorityRecordSchema>;
export type AuthorityMapDocument = z.infer<typeof authorityMapDocumentSchema>;
export type DuplicateInventoryGroup = z.infer<typeof duplicateInventoryGroupSchema>;
export type DuplicateInventoryDocument = z.infer<typeof duplicateInventoryDocumentSchema>;

export function parseAuthorityMapDocument(value: unknown): AuthorityMapDocument {
  return authorityMapDocumentSchema.parse(value);
}

export function parseDuplicateInventoryDocument(value: unknown): DuplicateInventoryDocument {
  return duplicateInventoryDocumentSchema.parse(value);
}
