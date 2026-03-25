import type { InstallPlan } from "../../domain/operations/install-plan.js";

export function generateGuidance(plan: InstallPlan): string {
  const lines = [
    `Harness Forge install ready for ${plan.selection.targetId}.`,
    'Use "hforge status" to inspect current state.',
    'Use "hforge commands --json" to inspect CLI commands and npm scripts exposed to agents.',
    'Use "hforge catalog --json" to review installed bundles.',
    'Use "hforge template list" to discover starter task and workflow templates.'
  ];

  if (plan.selection.targetId === "claude-code") {
    lines.push(
      "Claude Code runtime files are mapped into .claude/ when the target runtime bundle is present.",
      "Review .claude/settings.json before enabling shared hooks in a production workspace."
    );
  }

  if (plan.selection.targetId === "codex") {
    lines.push(
      "Codex runtime files are mapped into .codex/ when the target runtime bundle is present.",
      "If your Codex build does not auto-load project config, run node scripts/codex/apply-home-config.mjs --workspace ."
    );
  }

  return lines.join("\n");
}
