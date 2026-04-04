import { z } from "zod";
import { evidenceItemSchema, languageSignalSchema } from "../shared/evidence-item.js";

export const diagnosisResultSchema = z.object({
  generatedAt: z.string().min(1),
  root: z.string().min(1),
  repoType: z.string().min(1),
  dominantLanguages: z.array(languageSignalSchema),
  frameworkMatches: z.array(z.string().min(1)),
  toolingSignals: z.array(z.string().min(1)),
  detectedTargets: z.array(z.string().min(1)),
  riskSignals: z.array(z.string().min(1)),
  topEvidence: z.array(evidenceItemSchema),
  confidence: z.number().min(0).max(1),
});

export type DiagnosisResult = z.infer<typeof diagnosisResultSchema>;

export function parseDiagnosisResult(value: unknown): DiagnosisResult {
  return diagnosisResultSchema.parse(value);
}
