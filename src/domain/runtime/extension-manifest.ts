import { z } from "zod";

export const extensionManifestSchema = z.object({
  extensionId: z.string().min(1),
  version: z.string().min(1),
  compatibilityRange: z.string().min(1),
  sourceType: z.string().min(1),
  dependsOn: z.array(z.string().min(1)).default([]),
  overrideTargets: z.array(z.string().min(1)).default([]),
  contributes: z.array(z.string().min(1)).min(1)
});

export type ExtensionManifest = z.infer<typeof extensionManifestSchema>;

export function parseExtensionManifest(value: unknown): ExtensionManifest {
  return extensionManifestSchema.parse(value);
}
