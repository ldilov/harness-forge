import { z } from "zod";

export const guidanceAdoptionSignalSchema = z.object({
  signalId: z.string().min(1),
  suggestedCommand: z.string().min(1),
  wasTaken: z.boolean(),
  outcomeIfTaken: z.enum(["success", "failure", "unknown"]).nullable(),
  timestamp: z.string().min(1)
});

export type GuidanceAdoptionSignal = z.infer<typeof guidanceAdoptionSignalSchema>;

export function parseGuidanceAdoptionSignal(value: unknown): GuidanceAdoptionSignal {
  return guidanceAdoptionSignalSchema.parse(value);
}
