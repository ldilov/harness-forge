import { z } from "zod";

import { recursiveCodeCellLanguageSchema } from "./action-bundle.js";

export const recursiveCodeCellStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "blocked",
  "failed",
  "terminated"
]);

export const recursiveCodeCellSchema = z.object({
  cellId: z.string().min(1),
  sessionId: z.string().min(1),
  iterationId: z.string().min(1),
  languageId: recursiveCodeCellLanguageSchema,
  inputRefs: z.array(z.string().min(1)).default([]),
  expectedOutputs: z.array(z.string().min(1)).default([]),
  sandboxPosture: z.object({
    sandboxMode: z.string().min(1),
    networkPosture: z.string().min(1),
    timeoutMs: z.number().int().positive(),
    writeScope: z.string().min(1)
  }),
  status: recursiveCodeCellStatusSchema,
  title: z.string().min(1).optional(),
  resultRef: z.string().min(1).optional(),
  stdoutRef: z.string().min(1).optional(),
  stderrRef: z.string().min(1).optional(),
  sourceRef: z.string().min(1).optional(),
  helperRefs: z.array(z.string().min(1)).default([]),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1)
});

export const recursiveCodeCellResultSchema = z.object({
  cellId: z.string().min(1),
  verdict: z.enum(["completed", "blocked", "failed", "terminated"]),
  summary: z.string().min(1),
  outputRefs: z.array(z.string().min(1)).default([]),
  diagnostics: z.array(z.string().min(1)).default([]),
  helperRefs: z.array(z.string().min(1)).default([]),
  completedAt: z.string().min(1)
});

export type RecursiveCodeCell = z.infer<typeof recursiveCodeCellSchema>;
export type RecursiveCodeCellResult = z.infer<typeof recursiveCodeCellResultSchema>;

export function parseRecursiveCodeCell(value: unknown): RecursiveCodeCell {
  return recursiveCodeCellSchema.parse(value);
}

export function parseRecursiveCodeCellResult(value: unknown): RecursiveCodeCellResult {
  return recursiveCodeCellResultSchema.parse(value);
}
