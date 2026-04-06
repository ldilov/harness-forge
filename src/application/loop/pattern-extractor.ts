import type { EffectivenessScore } from '../../domain/loop/effectiveness-score.js';
import type { SessionTrace } from '../../domain/loop/session-trace.js';
import type { InsightPattern } from '../../domain/loop/insight-pattern.js';
import { generateId } from '../../shared/id-generator.js';
import { readScores, readTraces } from './trace-store.js';

function computeVariance(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
}

function computeConfidence(sampleSize: number, variance: number): number {
  const sizeFactor = Math.min(1, sampleSize / 20);
  const varianceFactor = 1 - Math.min(1, variance / 1000);
  return Math.round(sizeFactor * varianceFactor * 100) / 100;
}

function buildScoreMap(scores: readonly EffectivenessScore[]): ReadonlyMap<string, EffectivenessScore> {
  const map = new Map<string, EffectivenessScore>();
  for (const s of scores) {
    map.set(s.traceId, s);
  }
  return map;
}

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Group traces by compactionStrategies[0]. Compute avg score per strategy.
 * If one strategy avg is >10 points higher with 3+ samples, emit pattern.
 */
export function extractCompactionAffinity(
  scores: readonly EffectivenessScore[],
  traces: readonly SessionTrace[],
): InsightPattern | null {
  if (scores.length === 0 || traces.length === 0) return null;

  const scoreMap = buildScoreMap(scores);
  const strategyScores = new Map<string, number[]>();

  for (const trace of traces) {
    const strategy = trace.metrics.compactionStrategies[0];
    if (!strategy) continue;

    const score = scoreMap.get(trace.traceId);
    if (!score) continue;

    const existing = strategyScores.get(strategy) ?? [];
    strategyScores.set(strategy, [...existing, score.score]);
  }

  let bestStrategy = '';
  let bestAvg = -Infinity;
  let secondBestAvg = -Infinity;
  let allScoreValues: number[] = [];

  for (const entry of Array.from(strategyScores.entries())) {
    const [strategy, values] = entry;
    if (values.length < 3) continue;

    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    allScoreValues = [...allScoreValues, ...values];

    if (avg > bestAvg) {
      secondBestAvg = bestAvg;
      bestAvg = avg;
      bestStrategy = strategy;
    } else if (avg > secondBestAvg) {
      secondBestAvg = avg;
    }
  }

  if (!bestStrategy || secondBestAvg === -Infinity) return null;
  if (bestAvg - secondBestAvg <= 10) return null;

  const variance = computeVariance(allScoreValues);
  const ts = nowIso();

  return {
    id: generateId('pattern'),
    type: 'compaction_affinity',
    confidence: computeConfidence(allScoreValues.length, variance),
    sampleSize: allScoreValues.length,
    discoveredAt: ts,
    lastValidated: ts,
    finding: `Strategy '${bestStrategy}' averages ${Math.round(bestAvg)} vs ${Math.round(secondBestAvg)} for the next best — a ${Math.round(bestAvg - secondBestAvg)}-point advantage.`,
    evidence: {
      bestStrategy,
      bestAvg: Math.round(bestAvg),
      secondBestAvg: Math.round(secondBestAvg),
    },
    recommendation: {
      action: 'prefer_compaction_strategy',
      params: { strategy: bestStrategy },
      impact: `Prefer '${bestStrategy}' compaction for higher effectiveness.`,
    },
  };
}

/**
 * Bucket traces by token usage ratio (tokensUsed/tokenBudget) in 10% bands.
 * Find band with highest avg score. If 3+ samples, emit pattern with recommended threshold.
 */
export function extractBudgetSweetSpot(
  scores: readonly EffectivenessScore[],
  traces: readonly SessionTrace[],
): InsightPattern | null {
  if (scores.length === 0 || traces.length === 0) return null;

  const scoreMap = buildScoreMap(scores);
  const bands = new Map<number, number[]>();

  for (const trace of traces) {
    const ratio = trace.metrics.tokensUsed / trace.metrics.tokenBudget;
    const band = Math.min(9, Math.floor(ratio * 10));
    const score = scoreMap.get(trace.traceId);
    if (!score) continue;

    const existing = bands.get(band) ?? [];
    bands.set(band, [...existing, score.score]);
  }

  let bestBand = -1;
  let bestAvg = -Infinity;

  for (const entry of Array.from(bands.entries())) {
    const [band, values] = entry;
    if (values.length < 3) continue;

    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    if (avg > bestAvg) {
      bestAvg = avg;
      bestBand = band;
    }
  }

  if (bestBand < 0) return null;

  const bandValues = bands.get(bestBand) ?? [];
  const variance = computeVariance(bandValues);
  const bandLow = bestBand * 10;
  const bandHigh = (bestBand + 1) * 10;
  const ts = nowIso();

  return {
    id: generateId('pattern'),
    type: 'budget_sweet_spot',
    confidence: computeConfidence(bandValues.length, variance),
    sampleSize: bandValues.length,
    discoveredAt: ts,
    lastValidated: ts,
    finding: `Sessions using ${bandLow}%-${bandHigh}% of token budget score highest (avg ${Math.round(bestAvg)}).`,
    evidence: {
      band: bestBand,
      bandRange: `${bandLow}%-${bandHigh}%`,
      avgScore: Math.round(bestAvg),
      samples: bandValues.length,
    },
    recommendation: {
      action: 'set_budget_threshold',
      params: { targetRatio: (bestBand + 0.5) / 10 },
      impact: `Target ${bandLow}%-${bandHigh}% token utilization for optimal effectiveness.`,
    },
  };
}

/**
 * For each unique skill in traces, compare avg score with/without it.
 * If difference >10 with 3+ samples each, emit pattern for the most impactful skill.
 */
export function extractSkillEffectiveness(
  scores: readonly EffectivenessScore[],
  traces: readonly SessionTrace[],
): InsightPattern | null {
  if (scores.length === 0 || traces.length === 0) return null;

  const scoreMap = buildScoreMap(scores);
  const allSkills = new Set<string>();

  for (const trace of traces) {
    for (const skill of trace.metrics.skillsInvoked) {
      allSkills.add(skill);
    }
  }

  let bestSkill = '';
  let bestDiff = 0;
  let bestWithScores: number[] = [];
  let bestWithoutScores: number[] = [];

  for (const skill of Array.from(allSkills)) {
    const withSkill: number[] = [];
    const withoutSkill: number[] = [];

    for (const trace of traces) {
      const score = scoreMap.get(trace.traceId);
      if (!score) continue;

      if (trace.metrics.skillsInvoked.includes(skill)) {
        withSkill.push(score.score);
      } else {
        withoutSkill.push(score.score);
      }
    }

    if (withSkill.length < 3 || withoutSkill.length < 3) continue;

    const avgWith = withSkill.reduce((a, b) => a + b, 0) / withSkill.length;
    const avgWithout = withoutSkill.reduce((a, b) => a + b, 0) / withoutSkill.length;
    const diff = avgWith - avgWithout;

    if (diff > 10 && diff > bestDiff) {
      bestDiff = diff;
      bestSkill = skill;
      bestWithScores = withSkill;
      bestWithoutScores = withoutSkill;
    }
  }

  if (!bestSkill) return null;

  const allValues = [...bestWithScores, ...bestWithoutScores];
  const variance = computeVariance(allValues);
  const avgWith = bestWithScores.reduce((a, b) => a + b, 0) / bestWithScores.length;
  const avgWithout = bestWithoutScores.reduce((a, b) => a + b, 0) / bestWithoutScores.length;
  const ts = nowIso();

  return {
    id: generateId('pattern'),
    type: 'skill_effectiveness',
    confidence: computeConfidence(allValues.length, variance),
    sampleSize: allValues.length,
    discoveredAt: ts,
    lastValidated: ts,
    finding: `Skill '${bestSkill}' boosts scores by ${Math.round(bestDiff)} points (${Math.round(avgWith)} with vs ${Math.round(avgWithout)} without).`,
    evidence: {
      skill: bestSkill,
      avgWith: Math.round(avgWith),
      avgWithout: Math.round(avgWithout),
      diff: Math.round(bestDiff),
      samplesWithSkill: bestWithScores.length,
      samplesWithoutSkill: bestWithoutScores.length,
    },
    recommendation: {
      action: 'enable_skill',
      params: { skill: bestSkill },
      impact: `Enable '${bestSkill}' to improve session effectiveness.`,
    },
  };
}

/**
 * Filter scores below 50. If 3+ low-scoring sessions share budgetExceeded=true, emit pattern.
 */
export function extractFailureModes(
  scores: readonly EffectivenessScore[],
  traces: readonly SessionTrace[],
): InsightPattern | null {
  if (scores.length === 0 || traces.length === 0) return null;

  const scoreMap = buildScoreMap(scores);
  const traceMap = new Map<string, SessionTrace>();
  for (const t of traces) {
    traceMap.set(t.traceId, t);
  }

  const lowScores = scores.filter((s) => s.score < 50);
  if (lowScores.length < 3) return null;

  let budgetExceededCount = 0;
  const budgetExceededScores: number[] = [];

  for (const score of lowScores) {
    const trace = traceMap.get(score.traceId);
    if (trace?.outcome.budgetExceeded) {
      budgetExceededCount++;
      budgetExceededScores.push(score.score);
    }
  }

  if (budgetExceededCount < 3) return null;

  const variance = computeVariance(budgetExceededScores);
  const avgScore = budgetExceededScores.reduce((a, b) => a + b, 0) / budgetExceededScores.length;
  const ts = nowIso();

  return {
    id: generateId('pattern'),
    type: 'failure_mode',
    confidence: computeConfidence(budgetExceededCount, variance),
    sampleSize: budgetExceededCount,
    discoveredAt: ts,
    lastValidated: ts,
    finding: `${budgetExceededCount} low-scoring sessions exceeded their token budget (avg score ${Math.round(avgScore)}).`,
    evidence: {
      failureType: 'budgetExceeded',
      count: budgetExceededCount,
      avgScore: Math.round(avgScore),
    },
    recommendation: {
      action: 'increase_token_budget',
      params: {},
      impact: 'Increase token budget or enable earlier compaction to prevent budget exhaustion.',
    },
  };
}

/**
 * If 5+ traces have zero skillsInvoked, emit a 'pack_gap' pattern suggesting skill installation.
 */
export function extractPackGaps(traces: readonly SessionTrace[]): InsightPattern | null {
  if (traces.length === 0) return null;

  const noSkillTraces = traces.filter((t) => t.metrics.skillsInvoked.length === 0);

  if (noSkillTraces.length < 5) return null;

  const ts = nowIso();

  return {
    id: generateId('pattern'),
    type: 'pack_gap',
    confidence: computeConfidence(noSkillTraces.length, 0),
    sampleSize: noSkillTraces.length,
    discoveredAt: ts,
    lastValidated: ts,
    finding: `${noSkillTraces.length} sessions ran without any skill invocations — consider installing a skill pack.`,
    evidence: {
      sessionsWithoutSkills: noSkillTraces.length,
      totalSessions: traces.length,
    },
    recommendation: {
      action: 'install_skill_pack',
      params: {},
      impact: 'Install skill packs to unlock automated patterns and improve session outcomes.',
    },
  };
}

/**
 * Reads scores and traces, runs all extractors, filters out nulls.
 */
export async function extractPatterns(workspaceRoot: string): Promise<readonly InsightPattern[]> {
  const [scores, traces] = await Promise.all([
    readScores(workspaceRoot),
    readTraces(workspaceRoot),
  ]);

  const patterns = [
    extractCompactionAffinity(scores, traces),
    extractBudgetSweetSpot(scores, traces),
    extractSkillEffectiveness(scores, traces),
    extractFailureModes(scores, traces),
    extractPackGaps(traces),
  ];

  return patterns.filter((p): p is InsightPattern => p !== null);
}
