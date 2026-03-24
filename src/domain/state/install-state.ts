import path from "node:path";

import { ensureDir, exists, INSTALL_STATE_FILE, readJsonFile, STATE_DIR, writeJsonFile } from "../../shared/index.js";

export interface InstallStateRecord {
  version: number;
  installedTargets: string[];
  installedBundles: string[];
  appliedPlanHash: string;
  fileWrites: string[];
  backupSnapshots: string[];
  timestamps: {
    createdAt: string;
    updatedAt: string;
  };
  lastValidationStatus: "pass" | "fail" | "unknown";
}

export async function loadInstallState(root: string): Promise<InstallStateRecord | null> {
  const statePath = path.join(root, STATE_DIR, INSTALL_STATE_FILE);
  if (!(await exists(statePath))) {
    return null;
  }

  return readJsonFile<InstallStateRecord>(statePath);
}

export async function saveInstallState(root: string, state: InstallStateRecord): Promise<void> {
  const stateDir = path.join(root, STATE_DIR);
  await ensureDir(stateDir);
  await writeJsonFile(path.join(stateDir, INSTALL_STATE_FILE), state);
}
