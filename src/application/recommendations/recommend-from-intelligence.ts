import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { PACKAGE_ROOT } from "../../shared/index.js";
import { loadCapabilityTaxonomy, loadHarnessCapabilityMatrix } from "../../domain/manifests/index.js";
import { parseRepoIntelligenceResult, type RepoIntelligenceResult } from "../../domain/intelligence/repo-intelligence.js";

const execFileAsync = promisify(execFile);

async function loadTargetSupportSummary(root: string): Promise<RepoIntelligenceResult["targetSupport"]> {
  const [taxonomy, matrix] = await Promise.all([loadCapabilityTaxonomy(root), loadHarnessCapabilityMatrix(root)]);
  const taxonomyById = new Map(taxonomy.capabilities.map((entry) => [entry.id, entry]));

  return matrix.targets.map((target) => ({
    targetId: target.targetId,
    displayName: target.displayName,
    supportLevel: target.supportLevel,
    degradedCapabilities: target.capabilities
      .filter((record) => !(record.supportLevel === "full" && record.supportMode === "native"))
      .map((record) => ({
        capabilityId: record.capabilityId,
        displayName: taxonomyById.get(record.capabilityId)?.displayName ?? record.capabilityId,
        supportLevel: record.supportLevel,
        supportMode: record.supportMode,
        fallbackBehavior: record.fallbackBehavior
      }))
  }));
}

export async function recommendFromIntelligence(root: string): Promise<RepoIntelligenceResult> {
  const scriptPath = path.join(PACKAGE_ROOT, "scripts", "intelligence", "score-recommendations.mjs");
  const { stdout } = await execFileAsync(process.execPath, [scriptPath, root, "--json"], {
    cwd: PACKAGE_ROOT,
    maxBuffer: 1024 * 1024
  });

  const result = parseRepoIntelligenceResult(JSON.parse(stdout));
  return {
    ...result,
    targetSupport: await loadTargetSupportSummary(PACKAGE_ROOT)
  };
}
