import type { ProgressStep } from "../prompt-adapter.js";

export function renderProgress(steps: readonly ProgressStep[]): string {
  const lines: string[] = [];

  for (const step of steps) {
    const icon = statusIcon(step.status);
    lines.push(`${icon} ${step.label}`);
  }

  return lines.join("\n");
}

function statusIcon(status: ProgressStep["status"]): string {
  switch (status) {
    case "done":
      return "\u2714";
    case "failed":
      return "\u2717";
    case "running":
      return "\u2026";
    case "pending":
      return " ";
  }
}

export function createProgressTracker(
  stepLabels: readonly string[]
): ProgressTracker {
  const steps: ProgressStep[] = stepLabels.map((label) => ({
    label,
    status: "pending" as const,
  }));

  return {
    steps,
    start(index: number): void {
      if (index >= 0 && index < steps.length) {
        steps[index] = { ...steps[index]!, status: "running" };
      }
    },
    complete(index: number): void {
      if (index >= 0 && index < steps.length) {
        steps[index] = { ...steps[index]!, status: "done" };
      }
    },
    fail(index: number): void {
      if (index >= 0 && index < steps.length) {
        steps[index] = { ...steps[index]!, status: "failed" };
      }
    },
    render(): string {
      return renderProgress(steps);
    },
  };
}

export interface ProgressTracker {
  readonly steps: readonly ProgressStep[];
  start(index: number): void;
  complete(index: number): void;
  fail(index: number): void;
  render(): string;
}
