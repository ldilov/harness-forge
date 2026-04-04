import { createHash } from "node:crypto";

export interface ConceptIdentity {
  conceptId: string;
  canonicalPath: string;
  contentHash: string;
}

export function resolveConceptIdentity(conceptId: string, canonicalPath: string, content: string): ConceptIdentity {
  const contentHash = `sha256:${createHash("sha256").update(content).digest("hex")}`;
  return { conceptId, canonicalPath, contentHash };
}
