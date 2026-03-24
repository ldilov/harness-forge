import path from "node:path";

import { exists, ValidationError } from "../../shared/index.js";

export async function validateEnvironment(root: string, targetId: string): Promise<string[]> {
  const warnings: string[] = [];

  if (!(await exists(path.join(root, "manifests", "catalog", "index.json")))) {
    throw new ValidationError("Catalog index is missing.");
  }

  if (!(await exists(path.join(root, "targets", targetId, "adapter.json")))) {
    throw new ValidationError(`Unknown target adapter: ${targetId}`);
  }

  if (!(await exists(path.join(root, "templates")))) {
    warnings.push("Template catalog directory is missing.");
  }

  return warnings;
}
