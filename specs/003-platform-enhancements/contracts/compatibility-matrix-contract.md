# Contract: Compatibility Matrix

## Purpose

Define the machine-readable support matrix across targets and major Harness
Forge surfaces.

## Required Coverage

- target × bundle
- target × hook
- target × skill
- profile × target
- workflow × target
- language × framework

## Required Fields Per Entry

- `subjectType`
- `subjectId`
- `relationType`
- `relatedType`
- `relatedId`
- `supportLevel`

## Behavioral Rules

- partial support must never be rendered as full support
- unsupported relationships must still be visible when relevant to user choice
- generated documentation and install guidance must align with the matrix

## Validation Rules

- all referenced subjects must exist in the package surface
- partial or unsupported entries must include explanatory notes in generated docs
- target support docs must not contradict machine-readable compatibility data
