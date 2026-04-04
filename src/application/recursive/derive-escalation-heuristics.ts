import type { RecursiveEscalationHeuristics } from "../../domain/recursive/escalation-heuristics.js";

export function deriveRecursiveEscalationHeuristics(): RecursiveEscalationHeuristics {
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    summary: "Advisory recursive escalation triggers for installed agents. This surface nudges agents into recursive mode when ordinary chat-only reasoning is likely to lose evidence or context.",
    preferredSequence: [
      "inspect installed runtime surfaces",
      "check recursive capabilities and host runtimes",
      "plan a recursive session",
      "prefer Typed RLM action bundles",
      "inspect iterations, code cells, and scorecards",
      "summarize from durable artifacts"
    ],
    operatorHintCommand: "/hforge-recursive-investigate",
    advisoryOnly: true,
    triggers: [
      {
        id: "cross-module",
        label: "Cross-module investigation",
        description: "Use recursive mode when the task crosses packages, services, or ownership boundaries."
      },
      {
        id: "ambiguous-root-cause",
        label: "Ambiguous root cause",
        description: "Use recursive mode when the next step requires staged evidence gathering rather than a direct fix."
      },
      {
        id: "long-context",
        label: "Long context pressure",
        description: "Use recursive mode when prompt history is likely to get noisy without compact root frames and durable artifacts."
      },
      {
        id: "policy-sensitive",
        label: "Policy-sensitive execution",
        description: "Use recursive mode when bounded code cells, subcalls, checkpoints, or proposal artifacts are helpful."
      },
      {
        id: "artifact-worthy",
        label: "Artifact-worthy task",
        description: "Use recursive mode when the investigation should produce reusable evidence, scorecards, or helper scripts."
      }
    ],
    nonTriggers: [
      "straightforward single-file edits",
      "simple renames or formatting-only tasks",
      "questions answerable from one direct file read"
    ]
  };
}
