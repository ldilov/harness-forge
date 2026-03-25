# Contract: Repo Map

## Purpose

Define the structured topology output produced by repo cartography.

## Required Outputs

- workspace identity and type
- dominant languages with confidence
- framework detections with confidence
- package-manager, build, test, and deploy signals
- service or package boundaries
- critical and high-risk paths
- existing instruction surfaces
- quality gaps
- supporting evidence

## Required Fields

- `workspaceId`
- `workspaceType`
- `dominantLanguages[]`
- `frameworks[]`
- `services[]`
- `criticalPaths[]`
- `highRiskPaths[]`
- `existingInstructionSurfaces[]`
- `qualityGaps[]`

## Behavioral Rules

- topology facts must remain separate from instruction recommendations
- confidence-bearing detections must point to evidence
- generated or vendor paths must not drive the map as if they were owned source
- repeated scans of the same repo state should be materially stable

## Validation Rules

- benchmark fixtures must define expected repo-map highlights
- path references must resolve inside the scanned workspace
- confidence-bearing detections without evidence are invalid
