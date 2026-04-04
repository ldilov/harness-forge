import { type DuplicateInventoryDocument, type DuplicateInventoryGroup } from "../../domain/runtime/authority-and-dedup.js";

export interface DuplicateCandidate {
  conceptId: string;
  canonicalPath: string;
  duplicatePath: string;
  canonicalContent: string;
  duplicateContent: string;
}

function similarity(left: string, right: string): number {
  const a = new Set(left.toLowerCase().split(/\W+/).filter(Boolean));
  const b = new Set(right.toLowerCase().split(/\W+/).filter(Boolean));
  if (a.size === 0 || b.size === 0) {
    return 0;
  }
  let overlap = 0;
  for (const token of a) {
    if (b.has(token)) {
      overlap += 1;
    }
  }
  return overlap / new Set([...a, ...b]).size;
}

export function detectDuplicateInventory(candidates: DuplicateCandidate[]): DuplicateInventoryDocument {
  const groups: DuplicateInventoryGroup[] = [];
  let index = 1;

  for (const candidate of candidates) {
    const exact = candidate.canonicalContent === candidate.duplicateContent;
    const nearScore = exact ? 1 : similarity(candidate.canonicalContent, candidate.duplicateContent);
    if (!exact && nearScore < 0.8) {
      continue;
    }

    groups.push({
      groupId: `dup-${String(index).padStart(3, "0")}`,
      conceptId: candidate.conceptId,
      canonicalPath: candidate.canonicalPath,
      duplicatePaths: [candidate.duplicatePath],
      duplicateType: exact ? "exact" : "near",
      similarityScore: nearScore,
      estimatedRepeatedTokens: Math.max(0, Math.round(candidate.duplicateContent.split(/\s+/).length * 1.33)),
      recommendedAction: "Trim wrapper/projection and retain canonical source as primary retrieval target."
    });
    index += 1;
  }

  return {
    generatedAt: new Date().toISOString(),
    duplicateGroups: groups
  };
}
