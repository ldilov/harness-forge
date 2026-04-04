import type { ExportProfileManifest } from "../../domain/runtime/export-profile.js";

export function validateExportRequiredSurfaces(profile: ExportProfileManifest): { valid: boolean; missing: string[] } {
  const includeSet = new Set(profile.include);
  const missing = (profile.requiredCanonicalPaths ?? []).filter((entry) => !includeSet.has(entry));
  return { valid: missing.length === 0, missing };
}
