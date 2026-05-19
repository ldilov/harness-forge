import type { AgentHookEvent } from "./hook-event.js";
import type { AgentCommandRecommendation, AgentNextAction } from "./hook-run.js";

export interface TriggerContext {
  readonly goal: string;
  readonly files: readonly string[];
  readonly command: string;
}

type RawRecommendation = Omit<AgentCommandRecommendation, "id" | "priority">;

function quote(value: string): string {
  return `"${value.replace(/"/g, '\\"')}"`;
}

function fileArg(files: readonly string[]): string {
  return files.join(",");
}

function matrix(event: AgentHookEvent, ctx: TriggerContext): readonly RawRecommendation[] {
  switch (event) {
    case "task.started":
      return [
        {
          command: "hforge graph build --if-stale",
          reason: "Keep the project graph fresh before context selection.",
          autoExecutable: true,
          requiredAutonomy: "diagnostic",
          executor: "graph-build",
        },
        {
          command: `hforge context compile --goal ${quote(ctx.goal)}`,
          reason: "Produce a focused task context bundle.",
          autoExecutable: true,
          requiredAutonomy: "diagnostic",
          executor: "context-compile",
        },
      ];
    case "task.context_needed":
      return [
        {
          command: `hforge context compile --goal ${quote(ctx.goal)}`,
          reason: "Agent requested focused context.",
          autoExecutable: true,
          requiredAutonomy: "diagnostic",
          executor: "context-compile",
        },
      ];
    case "files.pre_edit":
    case "files.changed":
      return [
        {
          command: `hforge impact --files ${quote(fileArg(ctx.files))} --json`,
          reason: "Estimate blast radius and recommend verification.",
          autoExecutable: true,
          requiredAutonomy: "diagnostic",
          executor: "impact",
        },
      ];
    case "tests.failed":
    case "command.failed":
      return [
        {
          command: `hforge impact --files ${quote(fileArg(ctx.files))} --json`,
          reason: "Link the failure to impacted modules.",
          autoExecutable: true,
          requiredAutonomy: "diagnostic",
          executor: "impact",
        },
      ];
    case "pr.prep":
      return [
        {
          command: "hforge impact --changed --json",
          reason: "Summarize the change set for the PR narrative.",
          autoExecutable: true,
          requiredAutonomy: "diagnostic",
          executor: "impact",
        },
      ];
    case "task.completed":
      return [
        {
          command: "hforge impact --changed --json",
          reason: "Confirm verification scope before finalizing.",
          autoExecutable: true,
          requiredAutonomy: "diagnostic",
          executor: "impact",
        },
      ];
    default:
      return [];
  }
}

export function recommendationsFor(
  event: AgentHookEvent,
  ctx: TriggerContext,
): readonly AgentCommandRecommendation[] {
  return matrix(event, ctx).map((raw, index) => ({
    ...raw,
    id: `rec_${event}_${index}`,
    priority: index,
  }));
}

export function nextActionFor(
  event: AgentHookEvent,
  recommendationCount: number,
): AgentNextAction {
  if (recommendationCount === 0) {
    return { kind: "none", hint: `No broker action mapped for ${event}.` };
  }
  if (event === "task.started" || event === "task.context_needed") {
    return { kind: "read-bundle", hint: "Read the compiled context bundle before acting." };
  }
  if (event === "files.changed" || event === "files.pre_edit" || event === "tests.failed") {
    return { kind: "review-impact", hint: "Review the impact report and run recommended verification." };
  }
  return { kind: "run-commands", hint: "Run the recommended commands in priority order." };
}
