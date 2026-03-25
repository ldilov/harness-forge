# Contract: Instruction Plan

## Purpose

Define the target-aware recommendation contract for synthesized instruction
surfaces.

## Required Outputs

- target id
- scope strategy
- ordered instruction recommendations
- provenance for every recommendation
- risk notes for degraded support or low confidence

## Required Fields Per Recommendation

- `path`
- `surfaceType`
- `reason`
- `confidence`
- `evidence[]`

## Optional Fields

- `writeMode`
- `riskNotes[]`
- `recommendedProfiles[]`
- `recommendedSkills[]`

## Behavioral Rules

- recommendations must explain why root-only guidance is insufficient before
  adding scoped guidance
- unsupported target surfaces must never be recommended as native outputs
- dry-run and diff inspection must preserve the same reasoning as write-ready
  output

## Validation Rules

- recommendations must include at least one evidence item
- the plan must be deterministic for the same repo state
- scope strategy must match the emitted recommendation set
