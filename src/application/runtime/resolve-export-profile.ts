import path from "node:path";

import { parseExportProfileManifest, type ExportProfileManifest } from "../../domain/runtime/export-profile.js";
import { readJsonFile } from "../../shared/index.js";

interface RuntimeExportProfilesDocument {
  profiles: ExportProfileManifest[];
}

export async function resolveExportProfile(packageRoot: string, profileId: string): Promise<ExportProfileManifest | null> {
  const manifestPath = path.join(packageRoot, "manifests", "profiles", "runtime-export-profiles.json");
  const document = await readJsonFile<RuntimeExportProfilesDocument>(manifestPath);
  const profile = document.profiles.find((entry) => entry.profile === profileId);
  return profile ? parseExportProfileManifest(profile) : null;
}
