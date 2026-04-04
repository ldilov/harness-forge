import { type AuthorityMapDocument, type ConceptAuthorityRecord } from "../../domain/runtime/authority-and-dedup.js";

export function buildAuthorityMap(concepts: ConceptAuthorityRecord[]): AuthorityMapDocument {
  const byConcept = new Map<string, ConceptAuthorityRecord>();
  for (const concept of concepts) {
    if (!byConcept.has(concept.conceptId)) {
      byConcept.set(concept.conceptId, concept);
    }
  }

  return {
    schemaVersion: "1.0.0",
    generatedAt: new Date().toISOString(),
    concepts: [...byConcept.values()].sort((a, b) => a.conceptId.localeCompare(b.conceptId))
  };
}
