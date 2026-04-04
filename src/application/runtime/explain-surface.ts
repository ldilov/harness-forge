import path from "node:path";

import type { ProvenanceIndexDocument } from "../../domain/runtime/provenance.js";
import { RUNTIME_DIR, RUNTIME_PROVENANCE_DIR, PROVENANCE_INDEX_FILE, exists, readJsonFile } from "../../shared/index.js";

export async function explainSurface(workspaceRoot: string, surfacePath: string): Promise<Record<string, unknown> | null> {
  const provenancePath = path.join(workspaceRoot, RUNTIME_DIR, RUNTIME_PROVENANCE_DIR, PROVENANCE_INDEX_FILE);
  if (!(await exists(provenancePath))) {
    return null;
  }

  const document = await readJsonFile<ProvenanceIndexDocument>(provenancePath);
  const normalized = path.isAbsolute(surfacePath)
    ? path.relative(workspaceRoot, surfacePath).replaceAll("\\", "/")
    : surfacePath.replaceAll("\\", "/");
  return document.records.find((record) => record.path === normalized) ?? null;
}
