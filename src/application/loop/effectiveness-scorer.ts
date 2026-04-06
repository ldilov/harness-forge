<<<<<<< HEAD
import type { SessionTrace } from '@domain/loop/session-trace.js';
import type { EffectivenessScore, ScoreBreakdown } from '@domain/loop/effectiveness-score.js';
import { SCORE_WEIGHTS } from '@domain/loop/effectiveness-score.js';
=======
import type { SessionTrace } from '../../domain/loop/session-trace.js';
import type { EffectivenessScore, ScoreBreakdown } from '../../domain/loop/effectiveness-score.js';
import { SCORE_WEIGHTS } from '../../domain/loop/effectiveness-score.js';
>>>>>>> worktree-agent-a71d267f

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function computeTokenEfficiency(trace: SessionTrace): number {
<<<<<<< HEAD
  return clamp(100 * (1 - trace.tokensUsed / trace.tokenBudget), 0, 100);
}

function computeTaskCompletion(trace: SessionTrace): number {
  const base = trace.completed ? 100 : 0;
  const penalty = trace.retries * 15 + trace.userCorrections * 20;
=======
  const { tokensUsed, tokenBudget } = trace.metrics;
  return clamp(100 * (1 - tokensUsed / tokenBudget), 0, 100);
}

function computeTaskCompletion(trace: SessionTrace): number {
  const base = trace.outcome.taskCompleted ? 100 : 0;
  const penalty = trace.outcome.retries * 15 + trace.outcome.userCorrections * 20;
>>>>>>> worktree-agent-a71d267f
  return clamp(base - penalty, 0, 100);
}

function computeCompactionHealth(trace: SessionTrace): number {
<<<<<<< HEAD
  if (trace.budgetExceeded) {
    return 0;
  }
  if (trace.compactionsTriggered === 0) {
    return 100;
  }
  return clamp(100 * (trace.tokensSaved / trace.tokensUsed), 0, 100);
=======
  if (trace.outcome.budgetExceeded) {
    return 0;
  }
  if (trace.metrics.compactionsTriggered === 0) {
    return 100;
  }
  return clamp(100 * (trace.metrics.tokensSaved / trace.metrics.tokensUsed), 0, 100);
>>>>>>> worktree-agent-a71d267f
}

function computeErrorRate(trace: SessionTrace): number {
  const totalActions =
<<<<<<< HEAD
    trace.compactionsTriggered +
    trace.subagentsSpawned +
    trace.commandsRun.length +
    1;
  return clamp(100 * (1 - trace.errorsEncountered / totalActions), 0, 100);
}

function computeUserFriction(trace: SessionTrace): number {
  return clamp(100 - trace.userCorrections * 25, 0, 100);
=======
    trace.metrics.compactionsTriggered +
    trace.metrics.subagentsSpawned +
    trace.metrics.commandsRun.length +
    1;
  return clamp(100 * (1 - trace.metrics.errorsEncountered / totalActions), 0, 100);
}

function computeUserFriction(trace: SessionTrace): number {
  return clamp(100 - trace.outcome.userCorrections * 25, 0, 100);
>>>>>>> worktree-agent-a71d267f
}

export function scoreSession(trace: SessionTrace): EffectivenessScore {
  const breakdown: ScoreBreakdown = {
    tokenEfficiency: computeTokenEfficiency(trace),
    taskCompletion: computeTaskCompletion(trace),
    compactionHealth: computeCompactionHealth(trace),
    errorRate: computeErrorRate(trace),
    userFriction: computeUserFriction(trace),
  };

  const weightedSum =
    breakdown.tokenEfficiency * SCORE_WEIGHTS.tokenEfficiency +
    breakdown.taskCompletion * SCORE_WEIGHTS.taskCompletion +
    breakdown.compactionHealth * SCORE_WEIGHTS.compactionHealth +
    breakdown.errorRate * SCORE_WEIGHTS.errorRate +
    breakdown.userFriction * SCORE_WEIGHTS.userFriction;

  return {
    sessionId: trace.sessionId,
<<<<<<< HEAD
    score: Math.round(weightedSum),
    breakdown,
=======
    traceId: trace.traceId,
    score: Math.round(weightedSum),
    breakdown,
    scoredAt: new Date().toISOString(),
    repo: trace.repo,
    target: trace.target,
>>>>>>> worktree-agent-a71d267f
  };
}
