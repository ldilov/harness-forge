# Contract: Capability Matrix

## Purpose

Define the canonical target-capability support contract that drives support
documentation, recommendation logic, runtime diagnostics, and release
validation.

## Required Coverage

- every supported target
- every capability family relevant to installation, guidance, hooks,
  observability, orchestration, and parallel execution
- target-specific sub-capabilities where support nuance matters

## Required Fields Per Capability Record

- `targetId`
- `capabilityId`
- `supportLevel`
- `supportMode`
- `evidenceSource[]`
- `lastValidatedAt`
- `validationMethod`
- `confidence`

## Optional Fields

- `notes`
- `fallbackBehavior`

## Behavioral Rules

- degraded support must never be rendered as full native support
- every surfaced support claim must resolve back to a capability record
- documentation and recommendation output must preserve fallback behavior where
  present
- confidence and validation metadata must be usable for release-gate decisions

## Validation Rules

- every documented target capability must have a canonical record
- every degraded claim must include notes or fallback behavior
- support docs must not contradict the canonical capability data
- validation output must detect stale or missing capability evidence
