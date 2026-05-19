import type { AgentStartBrief } from "../../domain/runtime/agent-brief.js";

const MAX_RECOMMENDED_ACTIONS = 6;
const MAX_WORDS = 600;

function bullet(items: string[]): string[] {
  return items.map((item) => `- ${item}`);
}

function countWords(value: string): number {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

export function renderAgentBriefMarkdown(brief: AgentStartBrief): string {
  const targets =
    brief.targets.length > 0
      ? brief.targets.map((target) => {
          const caveat = target.caveats.length > 0 ? ` (${target.caveats.join("; ")})` : "";
          return `${target.displayName}: ${target.supportMode}${caveat}`;
        })
      : ["No explicit target install recorded yet."];

  const lines = [
    "# Harness Forge Agent Brief",
    "",
    `Generated: ${brief.generatedAt}`,
    `Workspace: ${brief.workspace.label}`,
    `Freshness: ${brief.freshness.status} - ${brief.freshness.reason}`,
    "",
    "## Agent Orientation",
    brief.orientation.firstRun,
    brief.orientation.sessionStart,
    brief.orientation.deeperWork,
    "",
    "## Detected Stack",
    ...bullet(brief.detectedStack),
    "",
    "## Targets",
    ...bullet(targets),
    "",
    "## Trust First",
    ...bullet(brief.authoritativeSurfaces.slice(0, 8)),
    "",
    "## Command Resolution",
    ...bullet(brief.commandResolution),
    "",
    "## Next Actions",
    ...bullet(brief.recommendedNextActions.slice(0, MAX_RECOMMENDED_ACTIONS)),
    "",
    "## Fallback",
    ...bullet(brief.fallbackGuidance),
    ""
  ];

  const markdown = `${lines.join("\n")}\n`;
  if (countWords(markdown) > MAX_WORDS) {
    throw new Error(`Agent brief exceeds compactness budget of ${MAX_WORDS} words.`);
  }
  return markdown;
}
