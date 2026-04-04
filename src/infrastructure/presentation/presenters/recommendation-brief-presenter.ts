import type { RecommendationBrief } from "../../../domain/onboarding/recommendation-brief.js";

export type PresentationMode = "full" | "embedded";

export function presentRecommendationBrief(
  brief: RecommendationBrief,
  mode: PresentationMode = "full"
): string {
  const lines: string[] = [];

  lines.push("Recommended install");
  lines.push(`- Targets: ${brief.recommendedTargets.join(" + ")}`);
  lines.push(`- Profile: ${brief.recommendedProfile}`);
  if (brief.recommendedModules.length > 0) {
    lines.push(`- Modules: ${brief.recommendedModules.join(", ")}`);
  }

  if (mode === "full") {
    lines.push("");
    lines.push("Why this is recommended");
    for (const reason of brief.rationale.targets) {
      lines.push(`- ${reason.summary}`);
    }
    for (const reason of brief.rationale.profile) {
      lines.push(`- ${reason.summary}`);
    }
    for (const reason of brief.rationale.modules) {
      lines.push(`- ${reason.summary}`);
    }

    if (brief.caveats.length > 0) {
      lines.push("");
      lines.push("Caveats");
      for (const caveat of brief.caveats) {
        lines.push(`- ${caveat}`);
      }
    }

    if (brief.alternatives.length > 0) {
      lines.push("");
      lines.push("Alternative");
      for (const alt of brief.alternatives) {
        lines.push(`- ${alt.summary}`);
      }
    }

    lines.push("");
    lines.push(`Confidence: ${formatConfidence(brief.confidence.overall)}`);

    const maxEvidence = 5;
    if (brief.evidence.length > 0) {
      lines.push("");
      lines.push("Evidence");
      const shown = brief.evidence.slice(0, maxEvidence);
      for (const ev of shown) {
        const pathSuffix = ev.path ? ` (${ev.path})` : "";
        lines.push(`- ${ev.summary}${pathSuffix}`);
      }
      if (brief.evidence.length > maxEvidence) {
        lines.push(`- ... and ${brief.evidence.length - maxEvidence} more (use --show-evidence)`);
      }
    }
  }

  return lines.join("\n");
}

function formatConfidence(value: number): string {
  if (value >= 0.8) return "High";
  if (value >= 0.5) return "Medium";
  return "Low";
}
