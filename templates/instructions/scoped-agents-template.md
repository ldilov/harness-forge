---
id: scoped-agents-template
kind: task-template
title: Scoped Agents Guidance
summary: Draft a justified scoped guidance surface when root-only instructions would be too coarse.
status: stable
version: 1
supported_targets:
  - codex
  - claude-code
supported_languages:
  - any
owner: core
generated: false
---

## Purpose

Capture narrow, evidence-backed scoped guidance for one boundary that the root
guidance surface cannot cover well on its own.

## When to Use

Use when the repo map identifies a stable service, app, or subsystem that needs
local constraints beyond the repo root.

## Inputs

- repo map with service boundaries
- chosen target harness
- existing root guidance surface

## Optional Inputs

- benchmark expectations
- quality gaps for the scoped boundary
- high-risk paths inside the scope

## Constraints

- explain why root-only guidance is insufficient
- keep the scope boundary explicit and narrow
- do not duplicate repo-wide guidance without need

## Expected Outputs

- one scoped guidance recommendation or draft
- evidence for the boundary choice
- risk notes for any target-specific limitations

## Acceptance Criteria

- the scoped path is stable and justified
- the local guidance adds value beyond the root surface
- the recommendation remains reviewable before write

## Quality Gates

- scope choice is backed by repo-map evidence
- guidance does not overstate target-native support
- overlap with the root surface is minimized

## Suggested Workflow

1. Confirm the boundary from cartography output.
2. State why the root surface is not enough.
3. Draft only the local constraints that differ materially.
4. Keep the write mode conservative unless explicitly approved.

## Related Commands

- `node scripts/intelligence/classify-boundaries.mjs <repo> --json`
- `node scripts/intelligence/synthesize-instructions.mjs <repo> --dry-run --json`

## Related Agents

- `skills/repo-cartographer/SKILL.md`
- `skills/architecture-decision-records/SKILL.md`

## Examples

- recommend `apps/web/AGENTS.md` for a monorepo where frontend review rules
  differ from backend services
- recommend a scoped rule for a migration-heavy service with stricter local
  safety notes
