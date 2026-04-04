import { z } from "zod";

export const coherenceCheckSchema = z.object({
  name: z.string().min(1),
  status: z.enum(["pass", "warn", "fail"]),
  details: z.string().optional()
});

export const coherenceReportSchema = z.object({
  packageVersion: z.string().min(1),
  generatedAt: z.string().min(1),
  versionDomains: z.record(z.string()).default({}),
  checks: z.array(coherenceCheckSchema)
});

export type CoherenceCheck = z.infer<typeof coherenceCheckSchema>;
export type CoherenceReport = z.infer<typeof coherenceReportSchema>;

export function parseCoherenceReport(value: unknown): CoherenceReport {
  return coherenceReportSchema.parse(value);
}
