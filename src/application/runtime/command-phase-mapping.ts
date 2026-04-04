export type CommandPhaseId = "setup" | "operate" | "maintain" | "advanced";

export interface PhaseMapping {
  phase: CommandPhaseId;
  primaryInPhase: boolean;
}

export const COMMAND_PHASE_MAP: Record<string, PhaseMapping> = {
  // Setup
  "init": { phase: "setup", primaryInPhase: true },
  "install": { phase: "setup", primaryInPhase: false },
  "bootstrap": { phase: "setup", primaryInPhase: false },
  "shell-setup": { phase: "setup", primaryInPhase: false },

  // Operate
  "recommend": { phase: "operate", primaryInPhase: true },
  "review": { phase: "operate", primaryInPhase: false },
  "task": { phase: "operate", primaryInPhase: false },
  "pack": { phase: "operate", primaryInPhase: false },
  "recursive": { phase: "operate", primaryInPhase: false },
  "cartograph": { phase: "operate", primaryInPhase: false },
  "classify-boundaries": { phase: "operate", primaryInPhase: false },
  "synthesize-instructions": { phase: "operate", primaryInPhase: false },
  "scan": { phase: "operate", primaryInPhase: false },
  "flow": { phase: "operate", primaryInPhase: false },
  "parallel": { phase: "operate", primaryInPhase: false },

  // Maintain
  "status": { phase: "maintain", primaryInPhase: true },
  "refresh": { phase: "maintain", primaryInPhase: false },
  "update": { phase: "maintain", primaryInPhase: false },
  "doctor": { phase: "maintain", primaryInPhase: false },
  "audit": { phase: "maintain", primaryInPhase: false },
  "export": { phase: "maintain", primaryInPhase: false },
  "diff-install": { phase: "maintain", primaryInPhase: false },
  "observability": { phase: "maintain", primaryInPhase: false },
  "prune": { phase: "maintain", primaryInPhase: false },
  "sync": { phase: "maintain", primaryInPhase: false },

  // Advanced
  "catalog": { phase: "advanced", primaryInPhase: false },
  "commands": { phase: "advanced", primaryInPhase: false },
  "target": { phase: "advanced", primaryInPhase: false },
  "capabilities": { phase: "advanced", primaryInPhase: false },
  "template": { phase: "advanced", primaryInPhase: false },
  "profile": { phase: "advanced", primaryInPhase: false },
  "runtime": { phase: "advanced", primaryInPhase: false },
  "upgrade-surface": { phase: "advanced", primaryInPhase: false },
  "maintenance": { phase: "advanced", primaryInPhase: false },
};

export function resolveCommandPhase(commandId: string): PhaseMapping {
  // Match by exact id first, then try prefix matching for compound ids like "init-basic"
  const direct = COMMAND_PHASE_MAP[commandId];
  if (direct) {
    return direct;
  }

  // Try prefix match: "init-basic" -> "init", "task-list" -> "task", "recursive-plan" -> "recursive"
  // Prefix matches never inherit primaryInPhase to avoid duplicates
  for (const [key, mapping] of Object.entries(COMMAND_PHASE_MAP)) {
    if (commandId.startsWith(`${key}-`) || commandId === key) {
      return { phase: mapping.phase, primaryInPhase: false };
    }
  }

  return { phase: "advanced", primaryInPhase: false };
}

export const PHASE_LABELS: Record<CommandPhaseId, string> = {
  setup: "Setup",
  operate: "Operate",
  maintain: "Maintain",
  advanced: "Advanced",
};

export const PHASE_ORDER: readonly CommandPhaseId[] = ["setup", "operate", "maintain", "advanced"] as const;
