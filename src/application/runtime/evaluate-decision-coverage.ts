import type { DecisionCoverageResult } from "../../domain/runtime/decision-coverage.js";
import type { DecisionRecord } from "../../domain/runtime/decision-record.js";
import type { DecisionHealthSeverity } from "../../domain/runtime/decision-health.js";
import type { TaskPack } from "../../domain/runtime/task-pack.js";
import { isArchitectureSignificant, type ArchitectureSignificanceLevel } from "../../domain/runtime/architecture-significance.js";

function severityFor(level: ArchitectureSignificanceLevel, classification: DecisionCoverageResult["classification"]): DecisionHealthSeverity {
  if (classification === "covered" || classification === "not-required") {
    return "info";
  }
  if ((level === "high" || level === "critical") && classification !== "intentionally-uncovered") {
    return "blocker";
  }
  return "warning";
}

export function evaluateDecisionCoverage(taskPacks: readonly TaskPack[], decisions: readonly DecisionRecord[]): DecisionCoverageResult[] {
  const decisionById = new Map(decisions.map((decision) => [decision.id, decision]));

  return taskPacks.map((taskPack) => {
    const level = taskPack.architectureSignificance?.level ?? "low";
    const refs = [...new Set([...taskPack.decisionRefs, ...taskPack.asrRefs, ...taskPack.adrRefs])];
    const found = refs.map((ref) => decisionById.get(ref)).filter((record): record is DecisionRecord => Boolean(record));
    const missing = refs.filter((ref) => !decisionById.has(ref));
    const stale = found.filter((record) => record.status === "superseded" || record.reviewStatus === "superseded" || record.reviewStatus === "stale");

    let classification: DecisionCoverageResult["classification"];
    let rationale: string;
    let recommendedAction: string;

    if (refs.length > 0 && missing.length > 0) {
      classification = "broken-reference";
      rationale = `Task references missing decision record(s): ${missing.join(", ")}.`;
      recommendedAction = "Restore the referenced decision records or update the task pack decision references.";
    } else if (refs.length > 0 && stale.length > 0) {
      classification = "stale-reference";
      rationale = `Task references stale or superseded decision record(s): ${stale.map((record) => record.id).join(", ")}.`;
      recommendedAction = "Link the task to the current decision or update the supersession chain.";
    } else if (found.length > 0) {
      classification = "covered";
      rationale = "Task links to at least one active decision record.";
      recommendedAction = "No decision coverage action required.";
    } else if (taskPack.noDecisionRationale) {
      classification = "intentionally-uncovered";
      rationale = taskPack.noDecisionRationale.rationale;
      recommendedAction = "Review the no-decision rationale during release readiness.";
    } else if (isArchitectureSignificant(level)) {
      classification = "missing-coverage";
      rationale = "High or critical architecture-significant work has no decision reference or no-decision rationale.";
      recommendedAction = "Create or link an ASR/ADR, or record a reviewed no-decision rationale.";
    } else if (level === "medium") {
      classification = "missing-coverage";
      rationale = "Medium architecture-significant work has no decision reference.";
      recommendedAction = "Consider linking a decision record or recording why one is not required.";
    } else {
      classification = "not-required";
      rationale = "Low-significance work does not require decision coverage by default.";
      recommendedAction = "No decision coverage action required.";
    }

    return {
      taskId: taskPack.taskId,
      architectureSignificance: level,
      classification,
      decisionRefs: refs,
      noDecisionRationale: taskPack.noDecisionRationale,
      severity: severityFor(level, classification),
      rationale,
      recommendedAction
    };
  }).sort((left, right) => left.taskId.localeCompare(right.taskId));
}
