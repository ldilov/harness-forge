import type { RepoMap } from "../../domain/intelligence/repo-map.js";
import type { ImpactAnalysis, ImpactedModule } from "../../domain/runtime/impact-analysis.js";
import type { FileInterestDocument, FileInterestItem } from "../../domain/runtime/file-interest.js";
import { assessArchitectureSignificance } from "./assess-architecture-significance.js";

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function collectAffectedModules(items: FileInterestItem[], repoMap: RepoMap): ImpactedModule[] {
  const byModule = new Map<string, ImpactedModule>();
  const relevantItems = items.filter((item) => item.bucket !== "ignore-for-now");

  for (const item of relevantItems) {
    const moduleId =
      item.module ??
      repoMap.services.find((service) => {
        const servicePath = service.path.replaceAll("\\", "/").toLowerCase();
        const itemPath = item.path.replaceAll("\\", "/").toLowerCase();
        return servicePath === "." || itemPath.startsWith(`${servicePath}/`) || itemPath === servicePath;
      })?.id ??
      "workspace-root";

    const existing = byModule.get(moduleId);
    if (existing) {
      existing.paths = unique([...existing.paths, item.path]);
      if (item.confidence === "high") {
        existing.confidence = "high";
      } else if (item.confidence === "medium" && existing.confidence === "low") {
        existing.confidence = "medium";
      }
      continue;
    }

    byModule.set(moduleId, {
      id: moduleId,
      paths: [item.path],
      reason: item.reasons[0] ?? "selected from task-aware file context",
      confidence: item.confidence
    });
  }

  return [...byModule.values()].sort((left, right) => left.id.localeCompare(right.id));
}

export function deriveImpactAnalysis(taskId: string, fileInterest: FileInterestDocument, repoMap: RepoMap): ImpactAnalysis {
  const relevantItems = fileInterest.items.filter((item) => item.bucket !== "ignore-for-now");
  const affectedModules = collectAffectedModules(fileInterest.items, repoMap);
  const riskAreas = unique(
    relevantItems.flatMap((item) => {
      const tags = [...item.riskTags];
      if (item.role.includes("config")) {
        tags.push("configuration-risk");
      }
      if (item.role.includes("entry") || item.role.includes("router")) {
        tags.push("entrypoint-risk");
      }
      return tags;
    })
  ).sort((left, right) => left.localeCompare(right));
  const suggestedTests = unique(
    relevantItems.flatMap((item) => [
      ...item.relatedTests,
      ...(item.role.includes("test") ? [item.path] : [])
    ])
  ).sort((left, right) => left.localeCompare(right));
  const relatedAdrs = unique(relevantItems.flatMap((item) => item.relatedAdrs)).sort((left, right) => left.localeCompare(right));
  const openQuestions: string[] = [];

  if (suggestedTests.length === 0) {
    openQuestions.push("No related tests were identified for the current task context.");
  }

  if (relevantItems.some((item) => item.confidence === "low" && item.bucket === "must-include")) {
    openQuestions.push("At least one must-include file has low confidence and should be reviewed manually.");
  }

  const analysis: ImpactAnalysis = {
    taskId,
    generatedAt: new Date().toISOString(),
    basedOnCommit: fileInterest.basedOnCommit,
    affectedModules,
    riskAreas,
    suggestedTests,
    relatedAdrs,
    openQuestions
  };

  analysis.architectureSignificance = assessArchitectureSignificance({
    taskId,
    taskText: relevantItems.flatMap((item) => [...item.matchedKeywords, ...item.reasons]).join(" "),
    impactAnalysis: analysis
  });

  return analysis;
}
