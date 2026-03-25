export interface ShardState {
  shardId: string;
  assignedTasks: string[];
  executionLocation: string;
  status: "planned" | "active" | "blocked" | "complete" | "abandoned";
  lastCheckIn?: string;
  validationStatus: "pending" | "passing" | "failing" | "stale";
  mergeReadiness: "ready" | "blocked" | "unknown";
  blockers: string[];
}
