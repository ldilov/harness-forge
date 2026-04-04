import path from "node:path";

import type { InstallPlan } from "../../domain/operations/install-plan.js";
import type { UpdateActionPlanDocument } from "../../domain/runtime/update-action-plan.js";
import { classifyManagedSurface } from "./classify-managed-surface.js";

export function planWorkspaceUpdate(workspaceRoot: string, plan: InstallPlan): UpdateActionPlanDocument {
  return {
    operationType: plan.selection.mode === "dry-run" ? "preview-install" : "install",
    generatedAt: new Date().toISOString(),
    workspaceState: "mixed",
    items: plan.operations.map((operation) => {
      const classification = classifyManagedSurface(workspaceRoot, operation.destinationPath);
      return {
        path: path.relative(workspaceRoot, operation.destinationPath).replaceAll("\\", "/"),
        proposedAction:
          classification.editPolicy === "preserve-user-modifications"
            ? "preserve"
            : operation.type === "merge"
              ? "merge"
              : "replace",
        reason: `${operation.bundleId} requires ${operation.destinationPath}`,
        ownershipClass: classification.ownershipClass,
        recommendedAlternative:
          classification.editPolicy === "preserve-user-modifications"
            ? ".hforge/overrides/bridges/"
            : undefined
      };
    })
  };
}
