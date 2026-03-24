export type InstallOperationType =
  | "copy"
  | "merge"
  | "template-render"
  | "append-once"
  | "skip"
  | "remove";

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
  warnings: string[];
  conflicts: string[];
  backupRequirements: string[];
  hash: string;
  validationSummary: string[];
}
