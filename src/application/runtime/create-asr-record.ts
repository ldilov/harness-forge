import type { ArchitectureSignificanceAssessment } from "../../domain/runtime/architecture-significance.js";
import type { ImpactAnalysis } from "../../domain/runtime/impact-analysis.js";
import type { AsrRecord, DecisionIndexEntry } from "../../domain/runtime/decision-record.js";
import type { TaskPack } from "../../domain/runtime/task-pack.js";
import { writeDecisionRecord } from "./decision-runtime-store.js";

export interface CreateAsrRecordInput {
  workspaceRoot: string;
  taskPack: TaskPack;
  assessment: ArchitectureSignificanceAssessment;
  impactAnalysis?: ImpactAnalysis;
  summary?: string;
  problemStatement?: string;
  owner?: string;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function createAsrId(taskId: string): string {
  const compactTaskId = taskId.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `ASR-${compactTaskId || "UNSPECIFIED"}`;
}

function renderAsrMarkdown(record: AsrRecord): string {
  const lines = [
    `# ${record.id}: ${record.title}`,
    "",
    `- Status: ${record.status}`,
    `- Review status: ${record.reviewStatus}`,
    `- Architecture significance: ${record.architectureSignificance}`,
    `- Task refs: ${record.taskRefs.join(", ") || "none"}`,
    "",
    "## Summary",
    record.summary,
    "",
    "## Problem statement",
    record.problemStatement,
    "",
    "## Drivers",
    ...record.drivers.map((value) => `- ${value}`),
    "",
    "## Quality attributes",
    ...(record.qualityAttributes.length > 0 ? record.qualityAttributes.map((value) => `- ${value}`) : ["- none recorded"]),
    "",
    "## Constraints",
    ...(record.constraints.length > 0 ? record.constraints.map((value) => `- ${value}`) : ["- none recorded"]),
    "",
    "## Affected modules",
    ...(record.affectedModules.length > 0 ? record.affectedModules.map((value) => `- ${value}`) : ["- none recorded"]),
    "",
    "## Affected files",
    ...(record.affectedFiles.length > 0 ? record.affectedFiles.map((value) => `- ${value}`) : ["- none recorded"]),
    "",
    "## Risks",
    ...(record.risks.length > 0 ? record.risks.map((value) => `- ${value}`) : ["- none recorded"]),
    "",
    "## Open questions",
    ...(record.openQuestions.length > 0 ? record.openQuestions.map((value) => `- ${value}`) : ["- none recorded"]),
    "",
    "## Promotion criteria",
    ...(record.promotionCriteria.length > 0 ? record.promotionCriteria.map((value) => `- ${value}`) : ["- none recorded"])
  ];

  return `${lines.join("\n")}\n`;
}

export async function createAsrRecord(input: CreateAsrRecordInput): Promise<{
  record: AsrRecord;
  indexEntry: DecisionIndexEntry;
}> {
  const timestamp = new Date().toISOString();
  const record: AsrRecord = {
    id: createAsrId(input.taskPack.taskId),
    recordType: "asr",
    title: input.taskPack.title,
    status: "proposed",
    reviewStatus: input.assessment.reviewStatus,
    architectureSignificance: input.assessment.level,
    taskRefs: [input.taskPack.taskId],
    requirementRefs: input.taskPack.requirements.map((requirement) => requirement.id),
    fileInterestRef: input.taskPack.fileInterestRef,
    impactAnalysisRef: input.taskPack.impactAnalysisRef,
    owner: input.owner,
    provenance: unique([
      input.taskPack.fileInterestRef ?? "",
      input.taskPack.impactAnalysisRef ?? "",
      ...input.taskPack.provenance
    ]),
    tags: unique(["runtime-governance", "architecture-significance", input.assessment.level]),
    createdAt: timestamp,
    updatedAt: timestamp,
    summary: input.summary ?? input.taskPack.summary,
    problemStatement:
      input.problemStatement ??
      input.taskPack.requestedOutcome ??
      input.taskPack.summary,
    drivers: unique([
      ...input.assessment.signals,
      ...input.taskPack.requirements.map((requirement) => requirement.title)
    ]),
    qualityAttributes: unique(
      (input.impactAnalysis?.riskAreas ?? []).filter((value) =>
        /\b(latency|performance|reliability|security|scalability|availability)\b/i.test(value)
      )
    ),
    constraints: [...input.taskPack.constraints],
    affectedModules: unique([
      ...input.taskPack.impactedModules,
      ...(input.impactAnalysis?.affectedModules ?? []).map((module) => module.id)
    ]),
    affectedFiles: unique(
      (input.impactAnalysis?.affectedModules ?? []).flatMap((module) => module.paths)
    ),
    risks: unique(input.impactAnalysis?.riskAreas ?? []),
    openQuestions: unique([
      ...input.taskPack.openQuestions,
      ...(input.impactAnalysis?.openQuestions ?? [])
    ]),
    optionsToEvaluate: [],
    promotionCriteria: [
      "a stable implementation direction is selected",
      "major constraints and trade-offs are understood",
      "validation and rollout expectations are explicit"
    ]
  };

  const persisted = await writeDecisionRecord(input.workspaceRoot, record, renderAsrMarkdown(record));
  return {
    record: persisted.record as AsrRecord,
    indexEntry: persisted.indexEntry
  };
}
