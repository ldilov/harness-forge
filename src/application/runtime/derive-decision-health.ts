import type { DecisionCoverageResult } from "../../domain/runtime/decision-coverage.js";
import type { DecisionRecord } from "../../domain/runtime/decision-record.js";
import type { DecisionHealthFinding } from "../../domain/runtime/decision-health.js";
import type { TaskPack } from "../../domain/runtime/task-pack.js";
import { ageInDays, parseISOTime } from "../../shared/timestamps.js";
import { buildDecisionChains } from "./build-decision-chain.js";

export interface DeriveDecisionHealthInput {
  decisions: readonly DecisionRecord[];
  taskPacks?: readonly TaskPack[];
  coverageResults?: readonly DecisionCoverageResult[];
  now?: Date;
}

const PROPOSED_STALE_DAYS = 30;
const DEFERRED_STALE_DAYS = 60;
const ACCEPTED_REVIEW_DAYS = 90;

function detected(now: Date): string {
  return now.toISOString();
}

function finding(input: Omit<DecisionHealthFinding, "detectedAt">, now: Date): DecisionHealthFinding {
  return { ...input, detectedAt: detected(now) };
}

export function deriveDecisionHealth(input: DeriveDecisionHealthInput): DecisionHealthFinding[] {
  const now = input.now ?? new Date();
  const findings: DecisionHealthFinding[] = [];
  const byId = new Map(input.decisions.map((decision) => [decision.id, decision]));

  for (const decision of input.decisions) {
    for (const field of ["createdAt", "updatedAt"] as const) {
      if (parseISOTime(decision[field]) === null) {
        findings.push(finding({
          id: `decision-timestamp-${decision.id}-${field}`,
          category: "timestamp-quality",
          severity: "warning",
          decisionId: decision.id,
          title: `Invalid ${field} on ${decision.id}`,
          rationale: `${decision.id} has a missing or malformed ${field} timestamp.`,
          evidence: [decision[field] ?? field],
          recommendedAction: "Update the decision record timestamp to a valid ISO 8601 value."
        }, now));
      }
    }

    const age = ageInDays(decision.updatedAt, now);
    if (decision.status === "proposed" && age !== null && age > PROPOSED_STALE_DAYS) {
      findings.push(finding({
        id: `decision-stale-proposed-${decision.id}`,
        category: "stale-decision",
        severity: "warning",
        decisionId: decision.id,
        title: `Proposed decision has aged past ${PROPOSED_STALE_DAYS} days`,
        rationale: `${decision.id} is still proposed after ${age} days.`,
        evidence: [decision.updatedAt],
        recommendedAction: "Accept, reject, defer, or refresh the proposed decision."
      }, now));
    }

    if (decision.status === "deferred" && age !== null && age > DEFERRED_STALE_DAYS) {
      findings.push(finding({
        id: `decision-stale-deferred-${decision.id}`,
        category: "unresolved-decision",
        severity: "warning",
        decisionId: decision.id,
        title: `Deferred decision needs review`,
        rationale: `${decision.id} has been deferred for ${age} days.`,
        evidence: [decision.updatedAt],
        recommendedAction: "Review whether the deferred decision should be accepted, rejected, or kept deferred."
      }, now));
    }

    if (decision.status === "accepted" && age !== null && age > ACCEPTED_REVIEW_DAYS) {
      const hasFollowUps = decision.recordType === "adr" ? decision.followUps.length > 0 : decision.openQuestions.length > 0;
      if (hasFollowUps) {
        findings.push(finding({
          id: `decision-accepted-review-${decision.id}`,
          category: "stale-decision",
          severity: "info",
          decisionId: decision.id,
          title: `Accepted decision has unresolved follow-up context`,
          rationale: `${decision.id} is accepted but still carries follow-up or open-question context after ${age} days.`,
          evidence: [decision.updatedAt],
          recommendedAction: "Confirm whether the follow-up work is complete or refresh the decision record."
        }, now));
      }
    }
  }

  for (const taskPack of input.taskPacks ?? []) {
    const refs = [...new Set([...taskPack.decisionRefs, ...taskPack.asrRefs, ...taskPack.adrRefs])];
    for (const ref of refs) {
      const decision = byId.get(ref);
      if (decision?.status === "superseded" || decision?.reviewStatus === "superseded") {
        findings.push(finding({
          id: `decision-stale-reference-${taskPack.taskId}-${ref}`,
          category: "stale-reference",
          severity: "warning",
          decisionId: ref,
          taskId: taskPack.taskId,
          title: `Task references superseded decision ${ref}`,
          rationale: `${taskPack.taskId} still references a superseded decision.`,
          evidence: [taskPack.taskId, ref],
          recommendedAction: "Update the task pack to reference the current decision record."
        }, now));
      }
    }
  }

  for (const chain of buildDecisionChains(input.decisions, detected(now))) {
    findings.push(...chain.findings);
  }

  for (const result of input.coverageResults ?? []) {
    if (result.classification === "covered" || result.classification === "not-required") {
      continue;
    }
    findings.push(finding({
      id: `decision-coverage-${result.taskId}`,
      category: "coverage-gap",
      severity: result.severity,
      taskId: result.taskId,
      title: `Decision coverage: ${result.classification}`,
      rationale: result.rationale,
      evidence: [result.taskId, ...result.decisionRefs],
      recommendedAction: result.recommendedAction
    }, now));
  }

  return findings.sort((left, right) => left.id.localeCompare(right.id));
}
