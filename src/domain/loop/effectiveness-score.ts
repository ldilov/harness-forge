export interface ScoreBreakdown {
  readonly tokenEfficiency: number;
  readonly taskCompletion: number;
  readonly compactionHealth: number;
  readonly errorRate: number;
  readonly userFriction: number;
}

export const SCORE_WEIGHTS: Readonly<Record<keyof ScoreBreakdown, number>> = {
  tokenEfficiency: 0.3,
  taskCompletion: 0.3,
  compactionHealth: 0.2,
  errorRate: 0.1,
  userFriction: 0.1,
} as const;

export interface EffectivenessScore {
  readonly sessionId: string;
  readonly score: number;
  readonly breakdown: ScoreBreakdown;
}
