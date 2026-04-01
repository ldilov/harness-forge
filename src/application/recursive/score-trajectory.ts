import type { RecursiveTrajectoryScorecard } from "../../domain/recursive/scorecard.js";
import {
  listRecursiveCodeCells,
  listRecursiveIterations,
  listRecursiveMetaOpProposals,
  listRecursivePromotionProposals,
  listRecursiveSubcalls,
  writeRecursiveScorecard,
  writeRecursiveSession,
  writeRecursiveSessionSummary
} from "../../infrastructure/recursive/session-store.js";
import { loadRecursiveSessionRuntime } from "./load-session-runtime.js";

function normalizeScore(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}

export async function scoreRecursiveTrajectory(workspaceRoot: string, sessionId: string): Promise<RecursiveTrajectoryScorecard> {
  const runtime = await loadRecursiveSessionRuntime(workspaceRoot, sessionId);
  const [iterations, subcalls, codeCells, promotions, metaOps] = await Promise.all([
    listRecursiveIterations(workspaceRoot, sessionId),
    listRecursiveSubcalls(workspaceRoot, sessionId),
    listRecursiveCodeCells(workspaceRoot, sessionId),
    listRecursivePromotionProposals(workspaceRoot, sessionId),
    listRecursiveMetaOpProposals(workspaceRoot, sessionId)
  ]);

  const blockedIterations = iterations.filter((iteration) => iteration.status === "blocked" || iteration.status === "failed").length;
  const wasteSignals = [
    ...(blockedIterations > 0 ? [`${blockedIterations} blocked-or-failed iterations`] : []),
    ...(subcalls.length > iterations.length ? ["subcall count exceeded iteration count"] : []),
    ...(codeCells.length > 1 ? ["multiple code cells were required"] : [])
  ];
  const scorecard: RecursiveTrajectoryScorecard = {
    scorecardId: `SCORE-${Date.now()}`,
    sessionId,
    effectivenessScore: normalizeScore(iterations.length > 0 ? 1 - blockedIterations / iterations.length : 0),
    efficiencyScore: normalizeScore(1 - Math.min((subcalls.length + codeCells.length) / 10, 1)),
    evidenceQualityScore: normalizeScore(iterations.some((iteration) => iteration.artifactsProduced.length > 0) ? 0.9 : 0.4),
    promotionQualityScore: normalizeScore(Math.min((promotions.length + metaOps.length) / 2, 1)),
    safetyScore: normalizeScore(codeCells.some((cell) => cell.status === "failed") ? 0.6 : 0.95),
    wasteSignals,
    recommendations: wasteSignals.length > 0 ? ["Tighten the root frame and reduce low-yield branches."] : ["Maintain current recursive posture."],
    generatedAt: new Date().toISOString()
  };
  await Promise.all([
    writeRecursiveScorecard(workspaceRoot, scorecard),
    writeRecursiveSession(workspaceRoot, {
      ...runtime.session,
      scorecardRef: `.hforge/runtime/recursive/sessions/${sessionId}/scorecards/latest.json`,
      updatedAt: new Date().toISOString()
    }),
    writeRecursiveSessionSummary(workspaceRoot, sessionId, {
      ...runtime.summary,
      scorecardRef: `.hforge/runtime/recursive/sessions/${sessionId}/scorecards/latest.json`,
      generatedAt: new Date().toISOString()
    })
  ]);

  return scorecard;
}
