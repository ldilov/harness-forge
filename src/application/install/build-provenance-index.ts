import path from "node:path";

import type { InstallPlan } from "../../domain/operations/install-plan.js";
import type { ProvenanceIndexDocument } from "../../domain/runtime/provenance.js";
import { classifyManagedSurface } from "./classify-managed-surface.js";

export function buildProvenanceIndex(workspaceRoot: string, plan: InstallPlan): ProvenanceIndexDocument {
  return {
    generatedAt: new Date().toISOString(),
    records: plan.operations.map((operation) => {
      const classification = classifyManagedSurface(workspaceRoot, operation.destinationPath);
      return {
        path: path.relative(workspaceRoot, operation.destinationPath).replaceAll("\\", "/"),
        ownershipClass: classification.ownershipClass,
        editPolicy: classification.editPolicy,
        sourceKind: operation.type === "copy" ? "canonical-authored-source" : "generated-derivative",
        selectedBy: plan.selection.profileId ? "profile" : "explicit",
        bundleId: operation.bundleId,
        installedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
        isModified: false
      };
    })
  };
}
