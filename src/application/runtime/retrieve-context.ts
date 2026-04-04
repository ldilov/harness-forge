import { rankRetrievalResults, type RetrievalCandidate } from "./rank-retrieval-results.js";

export interface RetrievalDecision {
  query: string;
  selected: RetrievalCandidate[];
  suppressed: RetrievalCandidate[];
}

export function retrieveContext(query: string, candidates: RetrievalCandidate[]): RetrievalDecision {
  const ranked = rankRetrievalResults(candidates);
  const seenConcepts = new Set<string>();
  const selected: RetrievalCandidate[] = [];
  const suppressed: RetrievalCandidate[] = [];

  for (const candidate of ranked) {
    if (seenConcepts.has(candidate.conceptId) && !candidate.canonical) {
      suppressed.push(candidate);
      continue;
    }
    selected.push(candidate);
    seenConcepts.add(candidate.conceptId);
  }

  return { query, selected, suppressed };
}
