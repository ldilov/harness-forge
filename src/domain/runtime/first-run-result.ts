import { z } from "zod";

export const firstRunResultSchema = z.object({
  schemaVersion: z.string().min(1),
  timestamp: z.string().min(1),
  repoType: z.string().min(1),
  targetPosture: z.string().min(1),
  generatedArtifacts: z.array(z.string().min(1)),
  primaryNextCommand: z.string().min(1),
  briefPath: z.string().min(1),
  recoveryGuidance: z.string().nullable(),
  partialSuccess: z.boolean()
});

export type FirstRunResult = z.infer<typeof firstRunResultSchema>;

export function parseFirstRunResult(value: unknown): FirstRunResult {
  return firstRunResultSchema.parse(value);
}
