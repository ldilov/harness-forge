export interface BenchmarkExpectation {
  fixtureId: string;
  repoArchetype: string;
  expectedRepoMap?: Record<string, unknown>;
  expectedRecommendations?: string[];
  expectedInstructionScopes?: string[];
  expectedQualityGaps?: string[];
  expectedObservabilityEvents?: string[];
  expectedParallelDecision?: string;
}
