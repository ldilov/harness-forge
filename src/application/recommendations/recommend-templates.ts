export function recommendTemplates(intent: string): string[] {
  const normalized = intent.toLowerCase();
  if (normalized.includes("fix") || normalized.includes("bug")) {
    return ["fix-bug", "triage-reproduce-fix-verify"];
  }
  if (normalized.includes("spec") || normalized.includes("plan")) {
    return ["implement-feature", "research-plan-implement-validate"];
  }
  return ["implement-feature", "research-plan-implement-validate"];
}
