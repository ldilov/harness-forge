import type { PromptSession } from "../prompt-io.js";

const TARGET_CHOICES = [
  {
    value: "codex",
    label: "Codex",
    description: "First-class target for the full hidden-runtime and maintenance experience."
  },
  {
    value: "claude-code",
    label: "Claude Code",
    description: "First-class target with native hook support."
  },
  {
    value: "cursor",
    label: "Cursor",
    description: "Portable docs and recommendation output, with more limited runtime support."
  },
  {
    value: "opencode",
    label: "OpenCode",
    description: "Portable docs and recommendation output, with more limited runtime support."
  }
] as const;

export async function promptForTargetSelection(
  promptSession: PromptSession,
  recommendedTargets: string[]
): Promise<string[]> {
  const fallback = recommendedTargets.length > 0 ? recommendedTargets : ["codex"];
  const selected = await promptSession.askMultiChoice(
    "targets",
    "Choose one or more agent targets",
    TARGET_CHOICES,
    fallback
  );
  return selected.length > 0 ? selected : fallback;
}
