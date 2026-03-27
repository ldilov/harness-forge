---
id: root-agents-template
kind: task-template
title: Root Agents Guidance
summary: Draft one repo-root guidance surface when the repository does not justify extra scoped instruction files.
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

Capture the minimum repo-wide guidance required to make the root instruction
surface useful without creating avoidable instruction sprawl.

## When to Use

Use when a repository can be served primarily by one root guidance file such as
`AGENTS.md` that points back to the hidden `.hforge/` AI layer and the shared
`.hforge/runtime/` intelligence runtime.

## Inputs

- repo map or equivalent repository evidence
- chosen target harness
- shared runtime index or equivalent runtime summary
- hidden canonical AI-layer paths under `.hforge/library/` and `.hforge/templates/`
- existing root guidance files, if any

## Optional Inputs

- benchmark expectations
- recommended profiles or skills
- known high-risk paths

## Constraints

- keep scope at the repository root unless evidence justifies more
- avoid repeating guidance that already exists elsewhere
- preserve target-support honesty when describing runtime behavior

## Expected Outputs

- one root guidance recommendation or draft
- explicit pointer back to `.hforge/runtime/index.json` plus the hidden canonical `.hforge/library/` surfaces
- explicit risk notes for any degraded target capability
- evidence showing why root-only guidance is sufficient

## Acceptance Criteria

- the root surface has a clear purpose and target
- evidence is cited for major guidance choices
- no extra scoped guidance is proposed without justification

## Quality Gates

- support claims align with `manifests/catalog/harness-capability-matrix.json`
- repo-map evidence is traceable
- generated output is reviewable before any write

## Suggested Workflow

1. Inspect the repo map and existing instruction surfaces.
2. Draft one root guidance surface that routes back to the hidden AI layer instead of duplicating canonical content at the repo root.
3. Call out risk areas and validation commands.
4. Stop if scoped guidance is not clearly justified.

## Related Commands

- `node scripts/intelligence/cartograph-repo.mjs <repo> --json`
- `node scripts/intelligence/synthesize-instructions.mjs <repo> --dry-run --json`

## Related Agents

- `skills/repo-cartographer/SKILL.md`
- `skills/repo-onboarding/SKILL.md`

## Examples

- add one repo-root `AGENTS.md` recommendation for a single-service app
- keep a small library on root-only guidance because no stable sub-boundaries
  need separate rules
