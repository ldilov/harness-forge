import { z } from "zod";

export const recursiveTemplateKindSchema = z.enum([
  "recursive-session",
  "asr",
  "adr-candidate",
  "review",
  "summary",
  "final-output"
]);
export const recursiveTemplateFormatSchema = z.enum(["md", "json"]);
export const recursiveTemplateScopeSchema = z.enum(["session", "decision", "review", "final-output"]);

export const recursiveTemplateEntrySchema = z.object({
  id: z.string().min(1),
  kind: recursiveTemplateKindSchema,
  file: z.string().min(1),
  format: recursiveTemplateFormatSchema,
  scope: recursiveTemplateScopeSchema,
  description: z.string().min(1),
  variables: z.array(z.string().min(1)).default([])
});

export const recursiveTemplateRegistrySchema = z.object({
  version: z.number().int().min(1),
  entries: z.array(recursiveTemplateEntrySchema).default([])
});

export type RecursiveTemplateEntry = z.infer<typeof recursiveTemplateEntrySchema>;
export type RecursiveTemplateRegistry = z.infer<typeof recursiveTemplateRegistrySchema>;

export function parseRecursiveTemplateRegistry(value: unknown): RecursiveTemplateRegistry {
  return recursiveTemplateRegistrySchema.parse(value);
}
