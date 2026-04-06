import type { RecommendationBrief } from "../../../domain/onboarding/recommendation-brief.js";
import type { TerminalCapabilityProfile } from "../../../cli/interactive/terminal-capabilities.js";
import { styleBox, styleEmoji, styleKeyValue, styleProgressBar } from "../../../cli/interactive/renderers/text-style.js";

export type PresentationMode = "full" | "embedded";

export function presentRecommendationBrief(
  brief: RecommendationBrief,
  mode: PresentationMode = "full",
  caps?: TerminalCapabilityProfile
): string {
  // When no capabilities provided, fall back to legacy plain-text output
  if (!caps) {
    return presentLegacy(brief, mode);
  }

  return presentBeautified(brief, mode, caps);
}

// ---------------------------------------------------------------------------
// Beautified output (box-drawn)
// ---------------------------------------------------------------------------

function presentBeautified(
  brief: RecommendationBrief,
  mode: PresentationMode,
  caps: TerminalCapabilityProfile
): string {
  const lines: string[] = [];

  lines.push(styleKeyValue(
    `${styleEmoji("\uD83C\uDFAF", caps, " ")} Targets`,
    brief.recommendedTargets.join(" + "),
    caps
  ));
  lines.push(styleKeyValue(
    `${styleEmoji("\uD83D\uDCCA", caps, " ")} Profile`,
    brief.recommendedProfile,
    caps
  ));
  if (brief.recommendedModules.length > 0) {
    lines.push(styleKeyValue(
      `${styleEmoji("\uD83D\uDCE6", caps, " ")} Modules`,
      brief.recommendedModules.join(", "),
      caps
    ));
  }

  if (mode === "full") {
    const allReasons = [
      ...brief.rationale.targets,
      ...brief.rationale.profile,
      ...brief.rationale.modules
    ];
    if (allReasons.length > 0) {
      lines.push("");
      lines.push(`${styleEmoji("\uD83D\uDCA1", caps, "*")} Why this setup?`);
      for (const reason of allReasons) {
        lines.push(`  ${styleEmoji("\u2022", caps, "-")} ${reason.summary}`);
      }
    }

    if (brief.caveats.length > 0) {
      lines.push("");
      lines.push(`${styleEmoji("\u26A0\uFE0F", caps, "!")} Caveats`);
      for (const caveat of brief.caveats) {
        lines.push(`  ${styleEmoji("\u2022", caps, "-")} ${caveat}`);
      }
    }

    if (brief.alternatives.length > 0) {
      lines.push("");
      lines.push(`${styleEmoji("\uD83D\uDD04", caps, "*")} Alternative`);
      for (const alt of brief.alternatives) {
        lines.push(`  ${styleEmoji("\u2022", caps, "-")} ${alt.summary}`);
      }
    }

    const confPercent = Math.round(brief.confidence.overall * 100);
    const confLabel = formatConfidence(brief.confidence.overall);
    lines.push("");
    lines.push(styleKeyValue(
      `${styleEmoji("\uD83D\uDCCA", caps, " ")} Confidence`,
      `${styleProgressBar(confPercent, 10, caps)} ${confLabel}`,
      caps
    ));

    const maxEvidence = 5;
    if (brief.evidence.length > 0) {
      lines.push("");
      lines.push(`${styleEmoji("\uD83D\uDD0E", caps, "*")} Evidence`);
      const shown = brief.evidence.slice(0, maxEvidence);
      for (const ev of shown) {
        const pathSuffix = ev.path ? ` (${ev.path})` : "";
        lines.push(`  ${styleEmoji("\u2022", caps, "-")} ${ev.summary}${pathSuffix}`);
      }
      if (brief.evidence.length > maxEvidence) {
        lines.push(`  ${styleEmoji("\u2022", caps, "-")} ... and ${brief.evidence.length - maxEvidence} more (use --show-evidence)`);
      }
    }
  }

  const titleIcon = styleEmoji("\uD83E\uDDE0", caps, "*");
  return styleBox(lines, caps, `${titleIcon} Recommended Setup`);
}

// ---------------------------------------------------------------------------
// Legacy plain-text output (no terminal capabilities)
// ---------------------------------------------------------------------------

function presentLegacy(brief: RecommendationBrief, mode: PresentationMode): string {
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
