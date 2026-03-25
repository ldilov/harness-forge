export interface MergeReadinessFinding {
  planId: string;
  status: "ready" | "blocked";
  reasons: string[];
  overlapPaths: string[];
  staleDependencies: string[];
  missingArtifacts: string[];
  requiredActions: string[];
}
