---
id: correctness-contract
kind: task-template
title: Correctness Contract
summary: Define invariants, failure modes, evidence, and rollback expectations before changing code, configuration, data, or workflows.
category: correctness
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
  - test
owner: core
generated: false
---

## Purpose

Define what the system must continue to do correctly so implementation and
review can focus on preserved behavior, not intuition.

## When to Use

Use before refactors, migrations, bug fixes, performance changes, API updates,
or any task where the code change is easy to make but correctness is easy to
misstate.

## Inputs

- approved change brief
- current behavior or baseline expectations
- contracts, interfaces, schemas, or runtime assumptions

## Optional Inputs

- production incidents or postmortems
- test history or flaky areas
- dependency or integration maps

## Constraints

- write the contract in terms of observable behavior, not implementation detail
- distinguish hard invariants from preferred behavior
- keep every claim testable or reviewable

## Expected Outputs

- invariants to preserve
- explicit failure modes and regression risks
- required evidence for confidence
- rollback condition tied to violated guarantees

## Acceptance Criteria

- preserved behavior is explicit enough for implementation and review
- compatibility boundaries are named
- failure conditions are concrete, not generic
- validation evidence maps back to the stated invariants

## Quality Gates

- every must-preserve statement has a validation path or manual check
- rollback triggers are defined for the highest-risk guarantees
- unclear assumptions are resolved or marked as risks

## Validation Tools

- `scripts/templates/shell/check-template-frontmatter.sh`
- `scripts/templates/powershell/Check-TemplateFrontmatter.ps1`
- `scripts/templates/config/required-sections.json`

## Suggested Workflow

Use `implement-change` after this contract exists.

## Related Commands

- `test`

## Related Agents

- `planner`

## Examples

- preserve backward compatibility for an API field rename
- guarantee idempotency during a migration backfill
- preserve deterministic output while refactoring a parser

## Working Template

### What is changing?

- change under review:
- system boundary affected:
- observable behaviors most likely to move:

### Why is it changing?

- goal of the change:
- defect, cost, or limitation being addressed:

### What must remain true?

- invariant 1:
- invariant 2:
- compatibility promise:
- data, security, or performance floor:

### What could break?

- regression risk:
- hidden coupling risk:
- operational or migration risk:
- user-visible failure mode:

### How will we know it works?

- required test or validation evidence:
- manual probe or observability signal:
- confidence threshold for ship/no-ship:

### How do we roll it back?

- rollback trigger:
- safe fallback state:
- recovery notes:

### What should future engineers remember?

- assumptions that were easy to miss:
- trade-offs accepted to preserve correctness:
- follow-up checks after release:
