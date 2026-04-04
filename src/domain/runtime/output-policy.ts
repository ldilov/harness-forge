import { z } from "zod";

export const outputProfileNameSchema = z.enum(["brief", "standard", "deep"]);

export const outputPolicyProfileSchema = z.object({
  maxOutputTokens: z.number().min(1),
  maxFindings: z.number().min(1),
  deltaOnly: z.boolean().default(false),
  artifactFirst: z.boolean().default(false)
});

export const outputPolicyDocumentSchema = z.object({
  schemaVersion: z.string().min(1),
  defaults: z.object({
    topLevelHuman: outputProfileNameSchema,
    recursiveWorker: outputProfileNameSchema,
    releaseSignoff: outputProfileNameSchema
  }),
  profiles: z.record(outputPolicyProfileSchema)
});

export const outputExecutionRecordSchema = z.object({
  recordId: z.string().min(1),
  actorType: z.string().min(1),
  workflowType: z.string().min(1),
  appliedProfile: outputProfileNameSchema,
  tokenCount: z.number().min(0),
  findingCount: z.number().min(0),
  artifactRefs: z.array(z.string().min(1)).default([])
});

export type OutputProfileName = z.infer<typeof outputProfileNameSchema>;
export type OutputPolicyProfile = z.infer<typeof outputPolicyProfileSchema>;
export type OutputPolicyDocument = z.infer<typeof outputPolicyDocumentSchema>;
export type OutputExecutionRecord = z.infer<typeof outputExecutionRecordSchema>;

export function parseOutputPolicyDocument(value: unknown): OutputPolicyDocument {
  return outputPolicyDocumentSchema.parse(value);
}

export function parseOutputExecutionRecord(value: unknown): OutputExecutionRecord {
  return outputExecutionRecordSchema.parse(value);
}
