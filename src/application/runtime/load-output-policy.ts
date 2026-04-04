import path from "node:path";

import { parseOutputPolicyDocument, type OutputPolicyDocument } from "../../domain/runtime/output-policy.js";
import { exists, readJsonFile } from "../../shared/index.js";

export async function loadOutputPolicy(workspaceRoot: string): Promise<OutputPolicyDocument | null> {
  const policyPath = path.join(workspaceRoot, ".hforge", "runtime", "output-policy.json");
  if (!(await exists(policyPath))) {
    return null;
  }
  return parseOutputPolicyDocument(await readJsonFile(policyPath));
}
