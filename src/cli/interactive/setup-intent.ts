import path from "node:path";

export type FolderSelectionMode = "current-directory" | "custom-path" | "new-folder";
export type SetupProfileId = "quick" | "recommended" | "advanced";
export type OptionalModuleId =
  | "working-memory"
  | "task-pack-support"
  | "decision-templates"
  | "export-support"
  | "recursive-runtime";

export interface FolderSelection {
  selectionMode: FolderSelectionMode;
  requestedPath: string;
  resolvedPath: string;
}

export interface SetupIntent {
  workspaceRoot: string;
  folderSelection: FolderSelection;
  targetIds: string[];
  setupProfile: SetupProfileId;
  enabledModules: OptionalModuleId[];
  recommendedTargetIds: string[];
  dryRun: boolean;
  applyChanges: boolean;
  source: "interactive" | "direct";
}

export interface SetupProfileDescriptor {
  id: SetupProfileId;
  displayName: string;
  description: string;
  manifestProfileId: string;
  defaultModules: OptionalModuleId[];
}

export const OPTIONAL_MODULE_LABELS: Record<OptionalModuleId, string> = {
  "working-memory": "Working memory",
  "task-pack-support": "Task-pack support",
  "decision-templates": "Decision templates",
  "export-support": "Export support",
  "recursive-runtime": "Recursive runtime"
};

export const OPTIONAL_MODULE_DESCRIPTIONS: Record<OptionalModuleId, string> = {
  "working-memory": "Keeps compact cached task context under the hidden runtime.",
  "task-pack-support": "Prepares task-oriented runtime artifacts and pack inspection flows.",
  "decision-templates": "Keeps governance and decision-record surfaces visible for architecture-significant work.",
  "export-support": "Keeps review and export handoff flows easy to reach after setup.",
  "recursive-runtime": "Leaves recursive session support available for difficult investigations."
};

export const SETUP_PROFILES: SetupProfileDescriptor[] = [
  {
    id: "quick",
    displayName: "Quick",
    description: "Minimal prompts with sensible defaults and a mandatory review before writes.",
    manifestProfileId: "core",
    defaultModules: ["export-support"]
  },
  {
    id: "recommended",
    displayName: "Recommended",
    description: "Best default for most repos, balancing guidance, intelligence, and maintenance.",
    manifestProfileId: "developer",
    defaultModules: ["working-memory", "task-pack-support", "export-support"]
  },
  {
    id: "advanced",
    displayName: "Advanced",
    description: "Full decision surface with optional modules and deeper runtime features.",
    manifestProfileId: "ai-runtime",
    defaultModules: ["working-memory", "task-pack-support", "decision-templates", "export-support", "recursive-runtime"]
  }
];

export function getSetupProfileDescriptor(profileId: SetupProfileId): SetupProfileDescriptor {
  const profile = SETUP_PROFILES.find((candidate) => candidate.id === profileId);
  if (!profile) {
    throw new Error(`Unknown setup profile: ${profileId}`);
  }
  return profile;
}

export function normalizeFolderSelection(baseRoot: string, mode: FolderSelectionMode, requestedPath: string): FolderSelection {
  const resolvedPath =
    mode === "current-directory" ? path.resolve(baseRoot) : path.resolve(baseRoot, requestedPath || ".");

  return {
    selectionMode: mode,
    requestedPath: requestedPath || ".",
    resolvedPath
  };
}
