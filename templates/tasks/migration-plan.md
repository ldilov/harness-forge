---
id: migration-plan
kind: task-template
title: Migration Plan
summary: Plan staged migrations with compatibility guarantees, rollback controls, validation gates, and durable operator notes.
category: delivery
status: stable
version: 1
applies_to:
  - codex
  - claude-code
  - cursor
  - opencode
languages:
  - any
supported_targets:
  - codex
  - claude-code
  - cursor
  - opencode
supported_languages:
  - any
recommended_agents:
  - planner
recommended_commands:
  - plan
  - test
owner: core
generated: false
---

## Purpose

Describe how to move from the current state to a target state without losing
control of compatibility, data integrity, or operational safety.

## When to Use

Use for schema, runtime, infrastructure, package, or workflow migrations that
cannot be treated as a single-shot edit.

## Inputs

- current-state description
- target-state description
- compatibility constraints and rollout boundaries

## Optional Inputs

- traffic or load characteristics
- backfill needs
- rollback cost estimates

## Constraints

- stage the migration so the system remains understandable at every step
- make compatibility assumptions explicit
- keep rollback realistic, not theoretical

## Expected Outputs

- staged rollout plan
- validation gates per stage
- rollback and fallback controls
- operator notes for the riskiest step

## Acceptance Criteria

- the migration can be executed in ordered phases
- compatibility is preserved or the break is explicitly owned
- cutover and rollback triggers are named
- post-migration cleanup is listed

## Quality Gates

- every stage has an entry and exit condition
- the highest-risk stage has a specific rollback plan
- backfill, drift, or dual-write risks are called out when relevant

## Validation Tools

- `scripts/templates/shell/check-template-frontmatter.sh`
- `scripts/templates/powershell/Check-TemplateFrontmatter.ps1`
- `scripts/templates/config/required-sections.json`

## Suggested Workflow

Use `implement-change` and attach stage-by-stage validation evidence.

## Related Commands

- `plan`
- `test`

## Related Agents

- `planner`

## Examples

- migrate an installer state shape without breaking existing workspaces
- move from one event contract to another behind a staged compatibility window

## Working Template

### What is changing?

- current state:
- target state:
- staged phases:

### Why is it changing?

- business or technical driver:
- risk of staying on the current path:

### What must remain true?

- compatibility guarantees:
- invariants during backfill or dual-run periods:
- operational guardrails:

### What could break?

- cutover risk:
- data drift or duplication risk:
- rollback complexity:

### How will we know it works?

- pre-cutover checks:
- per-stage validation:
- post-cutover confirmation:

### How do we roll it back?

- rollback trigger:
- last known safe state:
- cleanup after rollback:

### What should future engineers remember?

- temporary compatibility layers to remove:
- post-migration debt:
- lessons that should shape the next migration:
