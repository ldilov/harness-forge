import path from "node:path";

import type { ProvenanceIndexDocument } from "../../domain/runtime/provenance.js";
import { PROVENANCE_INDEX_FILE, RUNTIME_DIR, RUNTIME_PROVENANCE_DIR, writeJsonFile } from "../../shared/index.js";

export async function writeProvenanceIndex(
  workspaceRoot: string,
  document: ProvenanceIndexDocument
): Promise<string> {
  const provenancePath = path.join(workspaceRoot, RUNTIME_DIR, RUNTIME_PROVENANCE_DIR, PROVENANCE_INDEX_FILE);
  await writeJsonFile(provenancePath, document);
  return provenancePath;
}
