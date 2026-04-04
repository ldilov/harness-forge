import path from "node:path";

import type { EditPolicy, OwnershipClass } from "../../domain/runtime/provenance.js";

export function classifyManagedSurface(
  workspaceRoot: string,
  destinationPath: string
): { ownershipClass: OwnershipClass; editPolicy: EditPolicy } {
  const relativePath = path.relative(workspaceRoot, destinationPath).replaceAll("\\", "/");

  if (relativePath.startsWith(".hforge/library/")) {
    return { ownershipClass: "managed-canonical", editPolicy: "read-only-managed" };
  }
  if (relativePath === "AGENTS.md" || relativePath.startsWith(".agents/") || relativePath.startsWith(".codex/") || relativePath.startsWith(".claude/")) {
    return { ownershipClass: "managed-bridge", editPolicy: "preserve-user-modifications" };
  }
  if (relativePath.startsWith(".hforge/runtime/")) {
    return { ownershipClass: "generated-runtime", editPolicy: "generated-overwriteable" };
  }
  if (relativePath.startsWith(".hforge/state/")) {
    return { ownershipClass: "stateful-runtime", editPolicy: "merge-on-update" };
  }

  return { ownershipClass: "managed-bridge", editPolicy: "preserve-user-modifications" };
}
