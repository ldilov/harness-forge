Feature 003 planning adds repo intelligence, flow-state orchestration, typed hook manifests, compatibility matrix generation, benchmark fixtures, maintenance commands, and local-first observability on top of the existing TypeScript/Node CLI and manifest-driven package architecture.

Flow-state work should preserve the schema fields `featureId`, `currentStage`, `status`, `lastArtifact`, `nextAction`, and `updatedAt`, with optional blockers and artifact lineage for recovery.

Feature 004 planning adds canonical target-capability truth, repo-map and
instruction-plan contracts, append-safe observability events with derived
summaries, and conservative parallel execution planning with merge-readiness
checks. These new surfaces should integrate with existing `.specify/state/`
recovery and local package docs rather than creating a separate orchestration
stack.
