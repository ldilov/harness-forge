import type { InstallPlan } from "../../domain/operations/install-plan.js";

export function generateGuidance(plan: InstallPlan): string {
  const lines = [
    `Harness Forge install ready for ${plan.selection.targetId}.`,
    'Use "hforge status" to inspect current state.',
    "Use .hforge/library/ to inspect the hidden canonical AI layer for skills, rules, knowledge packs, and support docs.",
    "Use .hforge/runtime/index.json to inspect the shared runtime surfaces installed for this workspace.",
    "Use .hforge/runtime/README.md to inspect how target-specific discovery bridges route back to the shared runtime.",
    "Use .hforge/runtime/repo/repo-map.json to inspect the baseline repo map hydrated during bootstrap.",
    "Use .hforge/runtime/repo/instruction-plan.json to inspect target-aware bridge planning for installed runtimes.",
    "Use .hforge/runtime/findings/risk-signals.json to inspect baseline risk signals captured for the workspace.",
    'Use "hforge shell status --json" to inspect whether bare hforge is available on PATH.',
    'Use "hforge shell setup --yes" to add a user-level shim and supported shell profile block without forcing a global npm install.',
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
      "If your Codex build does not auto-load project config, run node .hforge/library/scripts/codex/apply-home-config.mjs --workspace ."
    );
  }

  return lines.join("\n");
}
