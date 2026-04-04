import type { EffectivenessSignalRecord } from "../../infrastructure/observability/local-metrics-store.js";
import { scoreEffectivenessDimensions } from "./score-effectiveness-dimensions.js";

export interface ComparisonWindow {
  readonly beforeTimestamp: string;
  readonly afterTimestamp: string;
  readonly deltas: Readonly<Record<string, number>>;
}

export function computeEffectivenessComparison(
  signals: readonly EffectivenessSignalRecord[],
  beforeTimestamp: string,
  afterTimestamp: string
): ComparisonWindow {
  const before = signals.filter(
    (s) => s.recordedAt >= beforeTimestamp && s.recordedAt < afterTimestamp
  );
  const after = signals.filter((s) => s.recordedAt >= afterTimestamp);

  const beforeScores = scoreEffectivenessDimensions(before);
  const afterScores = scoreEffectivenessDimensions(after);

  const deltas: Record<string, number> = {};
  for (const afterScore of afterScores) {
    const beforeScore = beforeScores.find(
      (s) => s.dimensionId === afterScore.dimensionId
    );
    deltas[afterScore.dimensionId] =
      afterScore.score - (beforeScore?.score ?? 0);
  }

  return { beforeTimestamp, afterTimestamp, deltas };
}
