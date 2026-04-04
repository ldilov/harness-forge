import { z } from "zod";

export const commandPhaseSchema = z.enum([
  "setup", "operate", "maintain", "advanced"
]);

export const commandPhaseRecordSchema = z.object({
  phase: commandPhaseSchema,
  primaryInPhase: z.boolean(),
  suggestWhen: z.array(z.string().min(1)),
  suppressWhen: z.array(z.string().min(1))
});

export type CommandPhase = z.infer<typeof commandPhaseSchema>;
export type CommandPhaseRecord = z.infer<typeof commandPhaseRecordSchema>;

export function parseCommandPhaseRecord(value: unknown): CommandPhaseRecord {
  return commandPhaseRecordSchema.parse(value);
}
