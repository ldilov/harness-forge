import { z } from "zod";

export const recursiveFinalOutputSectionSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  artifactRefs: z.array(z.string().min(1)).default([])
});

export const recursiveFinalOutputSchema = z.object({
  outputId: z.string().min(1),
  sessionId: z.string().min(1),
  status: z.enum(["draft", "finalized"]),
  summary: z.string().min(1),
  sections: z.array(recursiveFinalOutputSectionSchema).default([]),
  artifactRefs: z.array(z.string().min(1)).default([]),
  promotionRefs: z.array(z.string().min(1)).default([]),
  terminalVerdict: z.enum(["completed", "partial", "blocked", "failed"]),
  generatedAt: z.string().min(1)
});

export type RecursiveFinalOutput = z.infer<typeof recursiveFinalOutputSchema>;

export function parseRecursiveFinalOutput(value: unknown): RecursiveFinalOutput {
  return recursiveFinalOutputSchema.parse(value);
}
