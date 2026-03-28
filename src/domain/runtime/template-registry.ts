import { z } from "zod";

export const runtimeTemplateKindSchema = z.enum([
  "task-pack",
  "requirement",
  "implementation-note",
  "review-pack",
  "working-memory",
  "adr"
]);

export const runtimeTemplateScopeSchema = z.enum([
  "runtime",
  "task",
  "cache",
  "decision",
  "review"
]);

export const runtimeTemplateEntrySchema = z.object({
  id: z.string().min(1),
  kind: runtimeTemplateKindSchema,
  file: z.string().min(1),
  format: z.enum(["md", "json"]),
  scope: runtimeTemplateScopeSchema,
  description: z.string().min(1),
  variables: z.array(z.string().min(1)),
  supportedTargets: z.array(z.string().min(1)).default([]),
  overrideTargets: z.array(z.string().min(1)).default([])
});

export const runtimeTemplateRegistrySchema = z.object({
  version: z.number().int().positive(),
  entries: z.array(runtimeTemplateEntrySchema)
});

export type RuntimeTemplateKind = z.infer<typeof runtimeTemplateKindSchema>;
export type RuntimeTemplateScope = z.infer<typeof runtimeTemplateScopeSchema>;
export type RuntimeTemplateEntry = z.infer<typeof runtimeTemplateEntrySchema>;
export type RuntimeTemplateRegistry = z.infer<typeof runtimeTemplateRegistrySchema>;

export function parseRuntimeTemplateRegistry(value: unknown): RuntimeTemplateRegistry {
  return runtimeTemplateRegistrySchema.parse(value);
}
