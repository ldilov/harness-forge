import path from "node:path";

import type { FirstRunResult } from "../../domain/runtime/first-run-result.js";
import {
  FIRST_RUN_RESULT_SCHEMA_VERSION,
  RUNTIME_DIR,
  RUNTIME_REPO_DIR,
  FIRST_RUN_RESULT_FILE,
  ensureDir,
  writeJsonFile
} from "../../shared/index.js";

export interface FirstRunResultInput {
  workspaceRoot: string;
  repoType: string;
  briefPath: string;
  generatedArtifacts: string[];
  targetPosture: string;
  primaryNextCommand: string;
  partialSuccess: boolean;
  recoveryGuidance: string | null;
}

export async function generateFirstRunResult(input: FirstRunResultInput): Promise<FirstRunResult> {
  const result: FirstRunResult = {
    schemaVersion: FIRST_RUN_RESULT_SCHEMA_VERSION,
    timestamp: new Date().toISOString(),
    repoType: input.repoType,
    targetPosture: input.targetPosture,
    generatedArtifacts: input.generatedArtifacts,
    primaryNextCommand: input.primaryNextCommand,
    briefPath: input.briefPath,
    recoveryGuidance: input.recoveryGuidance,
    partialSuccess: input.partialSuccess
  };

  const repoDir = path.join(input.workspaceRoot, RUNTIME_DIR, RUNTIME_REPO_DIR);
  await ensureDir(repoDir);
  await writeJsonFile(path.join(repoDir, FIRST_RUN_RESULT_FILE), result);
  return result;
}
