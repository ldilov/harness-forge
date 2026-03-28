import type { ImpactAnalysis } from "../../domain/runtime/impact-analysis.js";
import type { TaskPack } from "../../domain/runtime/task-pack.js";
import {
  type ArchitectureSignificanceAssessment,
  type ArchitectureSignificanceLevel
} from "../../domain/runtime/architecture-significance.js";

const ARCHITECTURE_KEYWORD_PATTERN =
  /\b(auth|billing|persistence|database|migration|cache|caching|message|messaging|queue|deploy|deployment|contract|integration|rollout|rollback|security|latency|reliability|scalability)\b/i;

export interface AssessArchitectureSignificanceInput {
  taskId: string;
  taskText?: string;
  taskPack?: Partial<TaskPack>;
  impactAnalysis?: Partial<ImpactAnalysis>;
  sourceRefs?: string[];
  assessedBy?: string;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function levelFromScore(score: number): ArchitectureSignificanceLevel {
  if (score >= 5) return "critical";
  if (score >= 3) return "high";
  if (score >= 1) return "medium";
  return "low";
}

export function assessArchitectureSignificance(
  input: AssessArchitectureSignificanceInput
): ArchitectureSignificanceAssessment {
  const signals: string[] = [];
  const sourceRefs = [...(input.sourceRefs ?? [])];
  let score = 0;

  const affectedModules = input.impactAnalysis?.affectedModules?.length ?? input.taskPack?.impactedModules?.length ?? 0;
  if (affectedModules > 1) {
    signals.push(`affects multiple modules (${affectedModules})`);
    score += 2;
  }

  const searchableText = unique(
    [
      input.taskText,
      input.taskPack?.title,
      input.taskPack?.summary,
      ...(input.impactAnalysis?.riskAreas ?? []),
      ...(input.taskPack?.constraints ?? []),
      ...(input.taskPack?.openQuestions ?? [])
    ].filter((value): value is string => Boolean(value))
  ).join(" ");

  if (ARCHITECTURE_KEYWORD_PATTERN.test(searchableText)) {
    signals.push("touches architecture-sensitive boundaries or quality concerns");
    score += 2;
  }

  if ((input.impactAnalysis?.riskAreas?.length ?? 0) >= 2) {
    signals.push(`has multiple risk areas (${input.impactAnalysis?.riskAreas?.length ?? 0})`);
    score += 1;
  }

  if ((input.taskPack?.requirements?.length ?? 0) >= 3) {
    signals.push("requires multiple explicit implementation requirements");
    score += 1;
  }

  if (signals.length === 0) {
    signals.push("no architecture-significant triggers detected");
  }

  const level = levelFromScore(score);
  const confidence = score >= 3 ? "high" : score >= 1 ? "medium" : "low";

  if (input.taskPack?.fileInterestRef) {
    sourceRefs.push(input.taskPack.fileInterestRef);
  }
  if (input.taskPack?.impactAnalysisRef) {
    sourceRefs.push(input.taskPack.impactAnalysisRef);
  }

  return {
    taskId: input.taskId,
    level,
    signals,
    sourceRefs: unique(sourceRefs),
    confidence,
    reviewStatus: "inferred",
    assessedAt: new Date().toISOString(),
    assessedBy: input.assessedBy ?? "runtime-governance"
  };
}
