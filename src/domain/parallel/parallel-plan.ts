export interface ParallelPlanShard {
  shardId: string;
  taskIds: string[];
  worktreePath?: string;
  risk?: string;
}

export interface ParallelExecutionPlan {
  planId: string;
  featureId: string;
  strategy: string;
  rootTask: string;
  shards: ParallelPlanShard[];
  dependencies: Array<{ before: string; after: string }>;
  sharedRiskPaths: string[];
  expectedArtifacts: string[];
  validationGates: string[];
  mergeCriteria: string[];
  rollbackPlan?: string;
  fallbackToSingleThreadReason?: string | null;
}
