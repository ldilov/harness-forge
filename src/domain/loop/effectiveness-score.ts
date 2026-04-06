export interface EffectivenessScore {
  readonly sessionId: string;
  readonly scoredAt: string;
  readonly overall: number;
  readonly dimensions: {
    readonly correctness: number;
    readonly efficiency: number;
    readonly adherence: number;
  };
  readonly rationale: string;
}
