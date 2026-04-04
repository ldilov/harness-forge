import { z } from "zod";

export const staleValueWarningSchema = z.object({
  warningId: z.string().min(1),
  workspaceRoot: z.string().min(1),
  lastRuntimeCommandAt: z.string().min(1),
  daysSinceLastUse: z.number().int().min(0),
  recommendation: z.string().min(1)
});

export type StaleValueWarning = z.infer<typeof staleValueWarningSchema>;

export function parseStaleValueWarning(value: unknown): StaleValueWarning {
  return staleValueWarningSchema.parse(value);
}
