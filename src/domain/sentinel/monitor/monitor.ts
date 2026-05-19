import { z } from "zod";

export const SeveritySchema = z.enum(["info", "notice", "warning", "critical"]);
export type Severity = z.infer<typeof SeveritySchema>;

export const NetworkPolicySchema = z.enum([
  "none",
  "package-registry-only",
  "github-only",
  "allowlist",
  "unrestricted",
]);
export type NetworkPolicy = z.infer<typeof NetworkPolicySchema>;

export const MonitorActionSchema = z.object({
  type: z.string().min(1),
  capability: z.string().optional(),
});
export type MonitorAction = z.infer<typeof MonitorActionSchema>;

export const MonitorClassifySchema = z
  .object({
    severity: z
      .object({
        default: SeveritySchema.optional(),
      })
      .catchall(SeveritySchema)
      .optional(),
    confidence: z.number().min(0).max(1).optional(),
  })
  .strict();
export type MonitorClassify = z.infer<typeof MonitorClassifySchema>;

export function applyClassifyRule(
  classify: MonitorClassify | undefined,
  classifyKey: string | undefined,
  fallback: Severity,
): Severity {
  if (classifyKey === undefined) {
    return fallback;
  }
  const rules = classify?.severity;
  if (rules === undefined) {
    return fallback;
  }
  const named = (rules as Record<string, Severity | undefined>)[classifyKey];
  if (named !== undefined) {
    return named;
  }
  if (rules.default !== undefined) {
    return rules.default;
  }
  return fallback;
}

export const MonitorDedupeSchema = z
  .object({
    fingerprint: z.string().min(1),
    windowSeconds: z.number().int().positive().optional(),
  })
  .strict();
export type MonitorDedupe = z.infer<typeof MonitorDedupeSchema>;

export const MonitorObserveSchema = z
  .object({
    event: z.string().optional(),
    filter: z.record(z.string(), z.unknown()).optional(),
    inputs: z.array(z.string()).optional(),
  })
  .strict()
  .partial();
export type MonitorObserve = z.infer<typeof MonitorObserveSchema>;

export const MonitorConfigSchema = z
  .object({
    id: z
      .string()
      .min(1)
      .max(64)
      .regex(/^[a-z0-9][a-z0-9-]*$/),
    name: z.string().optional(),
    enabled: z.boolean().default(true),
    source: z.string().min(1),
    interval: z.string().min(1),
    network: NetworkPolicySchema.default("none"),
    capabilities: z.array(z.string()).default([]),
    observe: MonitorObserveSchema.default({}),
    classify: MonitorClassifySchema.default({}),
    dedupe: MonitorDedupeSchema,
    actions: z.array(MonitorActionSchema).default([]),
  })
  .strict();
export type MonitorConfig = z.infer<typeof MonitorConfigSchema>;

const INTERVAL_PATTERN = /^(\d+)(ms|s|m|h|d)$/;

export function parseIntervalSeconds(interval: string): number {
  const match = INTERVAL_PATTERN.exec(interval.trim());
  if (match === null) {
    throw new Error(`invalid interval syntax: ${interval}`);
  }
  const value = Number.parseInt(match[1]!, 10);
  switch (match[2]) {
    case "ms":
      return Math.max(0, Math.round(value / 1000));
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 60 * 60;
    case "d":
      return value * 60 * 60 * 24;
    default:
      throw new Error(`unknown interval unit: ${match[2]}`);
  }
}
