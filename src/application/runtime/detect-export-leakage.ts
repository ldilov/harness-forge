import type { ExportLeakageRecord, ExportProfileManifest } from "../../domain/runtime/export-profile.js";

export function detectExportLeakage(profile: ExportProfileManifest, exportedPaths: string[]): ExportLeakageRecord[] {
  const blocked = new Set(profile.exclude);
  const records: ExportLeakageRecord[] = [];
  for (const exportedPath of exportedPaths) {
    for (const blockedPrefix of blocked) {
      if (exportedPath === blockedPrefix || exportedPath.startsWith(`${blockedPrefix}/`)) {
        records.push({ profile: profile.profile, blockedPath: exportedPath, reason: `Path is excluded by profile rule: ${blockedPrefix}` });
      }
    }
  }
  return records;
}
