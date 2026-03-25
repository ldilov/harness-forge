# Contract: Flow State

## Purpose

Define the recoverable runtime state for Speckit-driven orchestration.

## Required Fields

- `featureId`
- `currentStage`
- `status`
- `lastArtifact`
- `nextAction`
- `updatedAt`

## Optional Fields

- `blockers[]`
- `artifactLineage[]`
- `notes`
- `targetContext`

## Behavioral Rules

- users must be able to enter at any stage and recover current flow state
- blocked states must identify why progress stopped
- artifact lineage must point to real generated artifacts
- the flow state surface must support both CLI and runtime-script reporting

## Validation Rules

- state records must match the flow-state schema
- unknown stages are invalid
- lineage references must resolve to known files when present
