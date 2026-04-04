import path from "node:path";

import { exists, readJsonFile } from "../../shared/index.js";

export interface ContextBudgetDocument {
  schemaVersion: string;
  maxFirstHopTokens: number;
  hotSurfaces: string[];
  warmSurfaces: string[];
  coldSurfaces: string[];
  dropOrder: string[];
  profiles: Record<string, { maxOutputTokens: number; maxFindings: number; deltaOnly?: boolean; artifactFirst?: boolean }>;
}

export async function loadContextBudget(workspaceRoot: string): Promise<ContextBudgetDocument | null> {
  const filePath = path.join(workspaceRoot, ".hforge", "runtime", "context-budget.json");
  if (!(await exists(filePath))) {
    return null;
  }
  return readJsonFile<ContextBudgetDocument>(filePath);
}
