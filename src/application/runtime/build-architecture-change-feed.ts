import type { ArchitectureChangeFeedEntry } from "../../domain/runtime/architecture-change-feed.js";
import type { DecisionCoverageResult } from "../../domain/runtime/decision-coverage.js";
import type { DecisionRecord } from "../../domain/runtime/decision-record.js";
import type { DecisionHealthFinding } from "../../domain/runtime/decision-health.js";
import type { TaskPack } from "../../domain/runtime/task-pack.js";
import { compareISODesc } from "../../shared/timestamps.js";

export interface BuildArchitectureChangeFeedInput {
  decisions: readonly DecisionRecord[];
  taskPacks?: readonly TaskPack[];
  healthFindings?: readonly DecisionHealthFinding[];
  coverageResults?: readonly DecisionCoverageResult[];
}

function pushUnique(entries: ArchitectureChangeFeedEntry[], entry: ArchitectureChangeFeedEntry): void {
  if (!entries.some((existing) => existing.id === entry.id)) {
    entries.push(entry);
  }
}

export function buildArchitectureChangeFeed(input: BuildArchitectureChangeFeedInput): ArchitectureChangeFeedEntry[] {
  const entries: ArchitectureChangeFeedEntry[] = [];

  for (const decision of input.decisions) {
    pushUnique(entries, {
      id: `decision-created-${decision.id}`,
      occurredAt: decision.createdAt,
      eventType: "decision-created",
      decisionIds: [decision.id],
      taskIds: [...decision.taskRefs],
      summary: `${decision.recordType.toUpperCase()} created: ${decision.title}`,
      evidence: [decision.id]
    });
    pushUnique(entries, {
      id: `decision-updated-${decision.id}`,
      occurredAt: decision.updatedAt,
      eventType: "decision-updated",
      decisionIds: [decision.id],
      taskIds: [...decision.taskRefs],
      summary: `${decision.recordType.toUpperCase()} updated: ${decision.title}`,
      evidence: [decision.id]
    });
  }

  for (const taskPack of input.taskPacks ?? []) {
    const decisionIds = [...new Set([...taskPack.decisionRefs, ...taskPack.asrRefs, ...taskPack.adrRefs])];
    if (decisionIds.length > 0) {
      pushUnique(entries, {
        id: `task-linked-${taskPack.taskId}`,
        occurredAt: taskPack.generatedAt,
        eventType: "task-linked",
        decisionIds,
        taskIds: [taskPack.taskId],
        summary: `Task linked to decision evidence: ${taskPack.title}`,
        evidence: [taskPack.taskId, ...decisionIds]
      });
    }
    if (taskPack.impactAnalysisRef) {
      pushUnique(entries, {
        id: `impact-analysis-linked-${taskPack.taskId}`,
        occurredAt: taskPack.generatedAt,
        eventType: "impact-analysis-linked",
        decisionIds,
        taskIds: [taskPack.taskId],
        summary: `Task includes impact analysis: ${taskPack.title}`,
        evidence: [taskPack.impactAnalysisRef]
      });
    }
  }

  for (const finding of input.healthFindings ?? []) {
    pushUnique(entries, {
      id: `health-finding-${finding.id}`,
      occurredAt: finding.detectedAt,
      eventType: "health-finding-created",
      decisionIds: finding.decisionId ? [finding.decisionId] : [],
      taskIds: finding.taskId ? [finding.taskId] : [],
      severity: finding.severity,
      summary: finding.title,
      evidence: finding.evidence
    });
  }

  for (const result of input.coverageResults ?? []) {
    pushUnique(entries, {
      id: `coverage-classified-${result.taskId}`,
      occurredAt: result.noDecisionRationale?.recordedAt ?? new Date(0).toISOString(),
      eventType: "coverage-classified",
      decisionIds: [...result.decisionRefs],
      taskIds: [result.taskId],
      severity: result.severity,
      summary: `Decision coverage classified as ${result.classification}`,
      evidence: [result.taskId, ...result.decisionRefs]
    });
  }

  return entries.sort((left, right) => {
    const chronological = compareISODesc(left.occurredAt, right.occurredAt);
    return chronological === 0 ? left.id.localeCompare(right.id) : chronological;
  });
}

export function filterArchitectureChangeFeed(
  entries: readonly ArchitectureChangeFeedEntry[],
  filter: "decisions" | "task-linked" | "stale" | "unresolved" | "superseded" | "architecture-significant"
): ArchitectureChangeFeedEntry[] {
  return entries.filter((entry) => {
    if (filter === "decisions") {
      return entry.eventType.startsWith("decision-");
    }
    if (filter === "task-linked") {
      return entry.taskIds.length > 0;
    }
    if (filter === "stale") {
      return entry.summary.toLowerCase().includes("stale");
    }
    if (filter === "unresolved") {
      return entry.summary.toLowerCase().includes("unresolved") || entry.summary.toLowerCase().includes("deferred");
    }
    if (filter === "superseded") {
      return entry.summary.toLowerCase().includes("superseded");
    }
    return entry.decisionIds.length > 0 || entry.taskIds.length > 0;
  });
}
