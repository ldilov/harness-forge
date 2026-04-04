import path from "node:path";

import type { CIGateResult } from "../../domain/runtime/governance-gates.js";
import { ensureDir, writeJsonFile } from "../../shared/index.js";

export async function writeGovernanceGateReport(workspaceRoot: string, results: CIGateResult[]): Promise<string> {
  const reportDir = path.join(workspaceRoot, ".hforge", "runtime", "governance");
  await ensureDir(reportDir);
  const reportPath = path.join(reportDir, "gate-report.json");
  await writeJsonFile(reportPath, {
    generatedAt: new Date().toISOString(),
    results
  });
  return reportPath;
}
