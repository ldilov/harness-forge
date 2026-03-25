import type { RepoIntelligenceResult, RepoRecommendation } from "../../domain/intelligence/repo-intelligence.js";

function formatRecommendationGroup(title: string, values: RepoRecommendation[]): string[] {
  if (values.length === 0) {
    return [`${title}: none`];
  }

  return [
    `${title}:`,
    ...values.map((value) => `- ${value.id} (${value.confidence.toFixed(2)}): ${value.why}`)
  ];
}

export function formatRecommendationReport(result: RepoIntelligenceResult): string {
  const lines = [
    `Repository: ${result.root}`,
    `Type: ${result.repoType}`
  ];

  if (result.dominantLanguages.length > 0) {
    lines.push(
      `Languages: ${result.dominantLanguages
        .map((value) => `${value.id} (${value.confidence.toFixed(2)})`)
        .join(", ")}`
    );
  }

  if (result.frameworkMatches.length > 0) {
    lines.push(
      `Frameworks: ${result.frameworkMatches
        .map((value) => `${value.id} (${value.confidence.toFixed(2)})`)
        .join(", ")}`
    );
  }

  lines.push(
    "",
    ...formatRecommendationGroup("Bundles", result.recommendations.bundles),
    "",
    ...formatRecommendationGroup("Profiles", result.recommendations.profiles),
    "",
    ...formatRecommendationGroup("Skills", result.recommendations.skills),
    "",
    ...formatRecommendationGroup("Validations", result.recommendations.validations)
  );

  if (result.targetSupport && result.targetSupport.length > 0) {
    lines.push("", "Target support:");
    for (const target of result.targetSupport) {
      if (target.degradedCapabilities.length === 0) {
        lines.push(`- ${target.displayName}: ${target.supportLevel}`);
        continue;
      }

      const degraded = target.degradedCapabilities
        .map((capability) => {
          const fallback = capability.fallbackBehavior ? `; fallback: ${capability.fallbackBehavior}` : "";
          return `${capability.displayName} (${capability.supportLevel}, ${capability.supportMode}${fallback})`;
        })
        .join("; ");
      lines.push(`- ${target.displayName}: ${target.supportLevel}. Degraded: ${degraded}`);
    }
  }

  return lines.join("\n");
}
