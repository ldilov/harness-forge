import { z } from "zod";

export const ownershipClassSchema = z.enum([
  "managed-canonical",
  "managed-bridge",
  "generated-runtime",
  "stateful-runtime",
  "user-owned",
  "external-reference"
]);

export const editPolicySchema = z.enum([
  "read-only-managed",
  "safe-user-edit",
  "generated-overwriteable",
  "merge-on-update",
  "preserve-user-modifications"
]);

export const provenanceRecordSchema = z.object({
  path: z.string().min(1),
  ownershipClass: ownershipClassSchema,
  editPolicy: editPolicySchema,
  sourceKind: z.string().min(1),
  selectedBy: z.string().min(1),
  bundleId: z.string().min(1).optional(),
  installedAt: z.string().optional(),
  lastUpdatedAt: z.string().optional(),
  isModified: z.boolean().optional()
});

export const provenanceIndexDocumentSchema = z.object({
  generatedAt: z.string().min(1),
  records: z.array(provenanceRecordSchema)
});

export type OwnershipClass = z.infer<typeof ownershipClassSchema>;
export type EditPolicy = z.infer<typeof editPolicySchema>;
export type ProvenanceRecord = z.infer<typeof provenanceRecordSchema>;
export type ProvenanceIndexDocument = z.infer<typeof provenanceIndexDocumentSchema>;

export function parseProvenanceIndexDocument(value: unknown): ProvenanceIndexDocument {
  return provenanceIndexDocumentSchema.parse(value);
}
