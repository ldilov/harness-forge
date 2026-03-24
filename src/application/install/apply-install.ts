import path from "node:path";

import type { InstallPlan } from "../../domain/operations/install-plan.js";
import { applyOperation } from "../../infrastructure/filesystem/apply-operation.js";
import { saveInstallState } from "../../domain/state/install-state.js";
import { writeTextFile } from "../../shared/index.js";
import { generateGuidance } from "./generate-guidance.js";

export async function applyInstall(root: string, plan: InstallPlan): Promise<{ messages: string[]; guidancePath: string }> {
  const messages: string[] = [];
  for (const operation of plan.operations) {
    messages.push(await applyOperation(operation));
  }

  const guidance = generateGuidance(plan);
  const guidancePath = path.join(root, ".hforge", "state", "post-install-guidance.txt");
  await writeTextFile(guidancePath, guidance);

  await saveInstallState(root, {
    version: 1,
    installedTargets: [plan.selection.targetId],
    installedBundles: [...new Set(plan.operations.map((operation) => operation.bundleId))],
    appliedPlanHash: plan.hash,
    fileWrites: plan.operations.map((operation) => operation.destinationPath),
    backupSnapshots: plan.backupRequirements,
    timestamps: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    lastValidationStatus: "unknown"
  });

  return { messages, guidancePath };
}
