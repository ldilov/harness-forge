import type { DecisionLog, DecisionLogEntry, DecisionLogGrouping } from "../../domain/runtime/decision-log.js";
import type { DecisionRecord } from "../../domain/runtime/decision-record.js";
import type { DecisionHealthFinding } from "../../domain/runtime/decision-health.js";
import { compareISODesc } from "../../shared/timestamps.js";

function supersessionState(record: DecisionRecord): string {
  if (record.recordType !== "adr") {
    return "not-applicable";
  }
  if (record.supersededBy.length > 0) {
    return `superseded-by:${record.supersededBy.join(",")}`;
  }
  if (record.supersedes.length > 0) {
    return `supersedes:${record.supersedes.join(",")}`;
  }
  return "current";
}

function summary(record: DecisionRecord): string {
  return record.recordType === "adr" ? record.decisionSummary : record.summary;
}

export function buildDecisionLog(
  records: readonly DecisionRecord[],
  findings: readonly DecisionHealthFinding[] = [],
  grouping: DecisionLogGrouping = "time-period",
  generatedAt = new Date().toISOString()
): DecisionLog {
  const entries: DecisionLogEntry[] = [...records]
    .sort((left, right) => {
      const chronological = compareISODesc(left.createdAt, right.createdAt);
      return chronological === 0 ? left.id.localeCompare(right.id) : chronological;
    })
    .map((record) => ({
      id: record.id,
      title: record.title,
      recordType: record.recordType,
      status: record.status,
      architectureSignificance: record.architectureSignificance,
      reviewStatus: record.reviewStatus,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      taskRefs: [...record.taskRefs],
      supersessionState: supersessionState(record),
      summary: summary(record)
    }));

  return {
    generatedAt,
    grouping,
    entries,
    findings: [...findings].sort((left, right) => left.id.localeCompare(right.id))
  };
}

export function renderDecisionLogMarkdown(log: DecisionLog): string {
  const lines = [
    "# Decision Log",
    "",
    `Generated: ${log.generatedAt}`,
    `Grouping: ${log.grouping}`,
    "",
    "This file is generated from canonical Harness Forge decision records.",
    ""
  ];

  for (const entry of log.entries) {
    lines.push(`## ${entry.createdAt.slice(0, 10)} - ${entry.id}: ${entry.title}`);
    lines.push("");
    lines.push(`- Type: ${entry.recordType}`);
    lines.push(`- Status: ${entry.status}`);
    lines.push(`- Significance: ${entry.architectureSignificance}`);
    lines.push(`- Review: ${entry.reviewStatus}`);
    lines.push(`- Updated: ${entry.updatedAt}`);
    lines.push(`- Tasks: ${entry.taskRefs.join(", ") || "none"}`);
    lines.push(`- Supersession: ${entry.supersessionState}`);
    if (entry.summary) {
      lines.push(`- Summary: ${entry.summary}`);
    }
    lines.push("");
  }

  if (log.findings.length > 0) {
    lines.push("## Findings", "");
    for (const finding of log.findings) {
      lines.push(`- ${finding.severity}: ${finding.title} (${finding.id})`);
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}
