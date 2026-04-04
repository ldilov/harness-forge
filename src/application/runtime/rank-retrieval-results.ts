export interface RetrievalCandidate {
  conceptId: string;
  path: string;
  relevance: number;
  tier: "hot" | "warm" | "cold";
  canonical: boolean;
  projection: boolean;
}

export function rankRetrievalResults(candidates: RetrievalCandidate[]): RetrievalCandidate[] {
  const tierScore = { hot: 0.3, warm: 0.1, cold: -0.4 } as const;
  return [...candidates]
    .map((candidate) => {
      const canonicalBonus = candidate.canonical ? 0.5 : 0;
      const projectionPenalty = candidate.projection ? 0.25 : 0;
      const score = candidate.relevance + tierScore[candidate.tier] + canonicalBonus - projectionPenalty;
      return { ...candidate, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ score: _score, ...candidate }) => candidate);
}
