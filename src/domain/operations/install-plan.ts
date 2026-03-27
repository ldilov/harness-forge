export type InstallOperationType =
  | "copy"
  | "merge"
  | "template-render"
  | "append-once"
  | "skip"
  | "remove";

export type SharedRuntimeSupportMode = "native" | "translated" | "documentation-only" | "unsupported";
export type InstallVisibilityMode = "hidden-ai-layer";

export interface VisibilityPolicySummary {
  mode: InstallVisibilityMode;
  aiLayerRoot: string;
  hiddenCanonicalRoots: string[];
  visibleBridgePaths: string[];
}

export interface SharedRuntimeSurface {
  id: string;
  path: string;
  description: string;
}

export interface SharedRuntimeArtifact {
  id: string;
  kind: "repo" | "finding" | "instruction" | "support";
  path: string;
  description: string;
  source: string;
}

export interface SharedRuntimeBridge {
  id: string;
  targetId: string;
  kind: "instruction" | "runtime" | "support-doc";
  path: string;
  supportMode: SharedRuntimeSupportMode;
  description: string;
}

export interface SharedRuntimeTarget {
  targetId: string;
  displayName: string;
  supportMode: SharedRuntimeSupportMode;
  instructionSurfaces: string[];
  runtimeSurfaces: string[];
  notes?: string;
}

export interface SharedRuntimePlan {
  runtimeId: string;
  rootDir: string;
  indexPath: string;
  readmePath: string;
  visibilityMode: InstallVisibilityMode;
  authoritativeSurfaces: string[];
  visibleBridgePaths: string[];
  durableSurfaces: SharedRuntimeSurface[];
  cacheSurfaces: SharedRuntimeSurface[];
  targets: SharedRuntimeTarget[];
  discoveryBridges: SharedRuntimeBridge[];
  baselineArtifacts: SharedRuntimeArtifact[];
}

export interface InstallSelection {
  targetId: string;
  profileId?: string;
  bundleIds: string[];
  languageIds: string[];
  frameworkIds: string[];
  capabilityIds: string[];
  rootPath: string;
  mode: "apply" | "dry-run";
  backupDir?: string;
}

export interface InstallOperation {
  type: InstallOperationType;
  bundleId: string;
  sourcePath: string;
  destinationPath: string;
  mergeStrategy: string;
  reason: string;
  riskLevel: "low" | "medium" | "high";
  backupRequired: boolean;
}

export interface InstallPlan {
  planId: string;
  selection: InstallSelection;
  operations: InstallOperation[];
  visibilityPolicy: VisibilityPolicySummary;
  sharedRuntime?: SharedRuntimePlan;
  warnings: string[];
  conflicts: string[];
  backupRequirements: string[];
  hash: string;
  validationSummary: string[];
}
