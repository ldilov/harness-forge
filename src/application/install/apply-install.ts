import path from "node:path";

import type { InstallPlan } from "../../domain/operations/install-plan.js";
import { applyOperation } from "../../infrastructure/filesystem/apply-operation.js";
import { loadInstallState, saveInstallState } from "../../domain/state/install-state.js";
import { PACKAGE_ROOT, writeTextFile } from "../../shared/index.js";
import { writeAgentCommandCatalog } from "../runtime/command-catalog.js";
import { generateGuidance } from "./generate-guidance.js";

export async function applyInstall(root: string, plan: InstallPlan): Promise<{ messages: string[]; guidancePath: string }> {
  const messages: string[] = [];
  for (const operation of plan.operations) {
    messages.push(await applyOperation(operation));
  }

  const guidance = generateGuidance(plan);
  const guidancePath = path.join(root, ".hforge", "state", "post-install-guidance.txt");
  await writeTextFile(guidancePath, guidance);

  const existingState = await loadInstallState(root);
  await saveInstallState(root, {
    version: 1,
    installedTargets: [...new Set([...(existingState?.installedTargets ?? []), plan.selection.targetId])],
    installedBundles: [
      ...new Set([...(existingState?.installedBundles ?? []), ...plan.operations.map((operation) => operation.bundleId)])
    ],
    appliedPlanHash: plan.hash,
    fileWrites: [...new Set([...(existingState?.fileWrites ?? []), ...plan.operations.map((operation) => operation.destinationPath)])],
    backupSnapshots: [...new Set([...(existingState?.backupSnapshots ?? []), ...plan.backupRequirements])],
    timestamps: {
      createdAt: existingState?.timestamps.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    lastValidationStatus: "unknown"
  });
  const commandCatalog = await writeAgentCommandCatalog(root, PACKAGE_ROOT);
  messages.push(`Agent command catalog written to ${commandCatalog.jsonPath}`);

  return { messages, guidancePath };
}
