# Contract: Hook Manifest

## Purpose

Define the typed runtime model for installable and diagnosable hooks.

## Required Fields

- `id`
- `family`
- `triggerStage`
- `mode`
- `targetCompatibility`
- `executionOrder`
- `failurePolicy`

## Optional Fields

- `timeoutBudget`
- `retryPolicy`
- `requiredInputs[]`
- `expectedOutputs[]`
- `observabilityFields[]`
- `notes`

## Behavioral Rules

- hooks must declare whether they are blocking or advisory
- target compatibility must distinguish supported, emulated, and unsupported
  behavior
- failures must produce a consistent, diagnosable message shape
- manifest-driven hooks must be installable and indexable by runtime tooling

## Validation Rules

- every manifest entry must conform to the hook schema
- blocking hooks must define actionable failure semantics
- target compatibility claims must match documented runtime support
