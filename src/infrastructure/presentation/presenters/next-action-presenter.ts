import type { NextActionPlan } from "../../../domain/next/next-action-plan.js";

export function presentNextAction(plan: NextActionPlan, verbose: boolean = false): string {
  const lines: string[] = [];

  lines.push("Best next action");
  lines.push(`- ${plan.title}`);

  lines.push("");
  lines.push("Why now");
  lines.push(`- ${plan.summary}`);

  lines.push("");
  lines.push("Command");
  lines.push(`- ${plan.command}`);

  lines.push("");
  lines.push(`Confidence: ${formatConfidence(plan.confidence)}`);

  if (plan.evidence.length > 0) {
    lines.push("");
    lines.push("Evidence");
    for (const ev of plan.evidence.slice(0, 5)) {
      const pathSuffix = ev.path ? ` (${ev.path})` : "";
      lines.push(`- ${ev.summary}${pathSuffix}`);
    }
  }

  if (plan.safeToAutoApply) {
    lines.push("");
    lines.push("Safety: Safe to run now");
  } else {
    lines.push("");
    lines.push("Safety: Review before applying");
  }

  if (plan.followUps.length > 0) {
    lines.push("");
    lines.push("Follow-ups");
    for (const fu of plan.followUps) {
      lines.push(`- ${fu.command}`);
    }
  }

  if (verbose && plan.alternatives.length > 0) {
    lines.push("");
    lines.push("Alternatives");
    for (const alt of plan.alternatives) {
      lines.push(`- ${alt.title}: ${alt.command}`);
    }
  }

  return lines.join("\n");
}

function formatConfidence(value: number): string {
  if (value >= 0.8) return "High";
  if (value >= 0.5) return "Medium";
  return "Low";
}
