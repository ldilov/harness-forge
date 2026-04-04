import { z } from "zod";

export const recursiveRuntimeIdSchema = z.enum(["node", "python", "powershell"]);
export const recursiveRuntimeAvailabilitySchema = z.enum(["available", "missing", "degraded"]);
export const recursiveRuntimeHealthSchema = z.enum(["healthy", "unhealthy", "unknown"]);
export const recursiveRuntimeProvisionerSchema = z.enum(["host", "workspace-managed", "manual-managed", "none"]);
export const recursiveRuntimeSourceSchema = z.enum(["process", "discovered", "registry", "explicit", "none"]);
export const recursiveOsFamilySchema = z.enum(["windows", "linux", "darwin", "unknown"]);
export const recursiveShellFamilySchema = z.enum(["powershell", "cmd", "bash", "zsh", "sh", "unknown"]);

export const recursiveRuntimeEntrySchema = z.object({
  runtimeId: recursiveRuntimeIdSchema,
  displayName: z.string().min(1),
  availability: recursiveRuntimeAvailabilitySchema,
  healthStatus: recursiveRuntimeHealthSchema,
  provisioner: recursiveRuntimeProvisionerSchema,
  source: recursiveRuntimeSourceSchema,
  managed: z.boolean().default(false),
  executablePath: z.string().min(1).optional(),
  command: z.string().min(1).optional(),
  args: z.array(z.string().min(1)).default([]),
  version: z.string().min(1).optional(),
  allowedByPolicy: z.boolean().optional(),
  notes: z.string().min(1),
  lastCheckedAt: z.string().min(1)
});

export const recursiveRuntimeInventorySchema = z.object({
  version: z.number().int().positive(),
  generatedAt: z.string().min(1),
  workspaceRoot: z.string().min(1),
  osFamily: recursiveOsFamilySchema,
  shellFamily: recursiveShellFamilySchema,
  summary: z.string().min(1),
  runtimes: z.array(recursiveRuntimeEntrySchema)
});

export type RecursiveRuntimeId = z.infer<typeof recursiveRuntimeIdSchema>;
export type RecursiveRuntimeAvailability = z.infer<typeof recursiveRuntimeAvailabilitySchema>;
export type RecursiveRuntimeHealth = z.infer<typeof recursiveRuntimeHealthSchema>;
export type RecursiveRuntimeProvisioner = z.infer<typeof recursiveRuntimeProvisionerSchema>;
export type RecursiveRuntimeSource = z.infer<typeof recursiveRuntimeSourceSchema>;
export type RecursiveOsFamily = z.infer<typeof recursiveOsFamilySchema>;
export type RecursiveShellFamily = z.infer<typeof recursiveShellFamilySchema>;
export type RecursiveRuntimeEntry = z.infer<typeof recursiveRuntimeEntrySchema>;
export type RecursiveRuntimeInventory = z.infer<typeof recursiveRuntimeInventorySchema>;

export function parseRecursiveRuntimeInventory(value: unknown): RecursiveRuntimeInventory {
  return recursiveRuntimeInventorySchema.parse(value);
}
