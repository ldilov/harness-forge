# Contract: Parallel Execution Plan

## Purpose

Define the planning, state, and merge-readiness contract for safe parallel
execution.

## Required Plan Fields

- `planId`
- `featureId`
- `strategy`
- `rootTask`
- `shards[]`
- `dependencies[]`
- `validationGates[]`
- `mergeCriteria[]`

## Optional Plan Fields

- `sharedRiskPaths[]`
- `expectedArtifacts[]`
- `rollbackPlan`
- `fallbackToSingleThreadReason`

## Required Shard State Fields

- `shardId`
- `assignedTasks[]`
- `executionLocation`
- `status`
- `validationStatus`
- `mergeReadiness`

## Behavioral Rules

- blocked or single-thread recommendations must explain why splitting is unsafe
- merge-readiness output must identify overlap, stale dependencies, or missing
  outputs explicitly
- shard state must remain resumable after interruption
- degraded targets must not be presented as having native parallel support

## Validation Rules

- active shards must define an execution location
- blocked merge findings must include actionable next steps
- benchmark fixtures must be able to assert expected parallel decisions
