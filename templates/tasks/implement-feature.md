---
id: implement-feature
kind: task-template
title: Implement Feature
summary: Deliver a new feature with explicit verification, updated docs, and clear artifact boundaries.
category: delivery
status: stable
version: 1
applies_to:
  - codex
  - claude-code
  - cursor
languages:
  - any
supported_targets:
  - codex
  - claude-code
  - cursor
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

Deliver a new feature in a way that preserves user value, verification, and
clear artifact boundaries.

## When to Use

Use this template when adding a new feature or major capability.

## Inputs

- approved spec or task brief
- implementation plan
- affected files or modules

## Optional Inputs

- architecture notes
- prior incident or bug history
- migration expectations

## Constraints

- keep changes scoped to the approved feature
- define verification before implementation
- update docs when behavior changes

## Expected Outputs

- implementation summary
- changed files
- validation results

## Acceptance Criteria

- feature behavior matches the approved spec
- validations pass or blockers are documented
- affected docs and guidance are updated

## Quality Gates

- tests fail before implementation and pass after changes
- no unresolved critical validation findings remain

## Validation Tools

- `scripts/templates/shell/check-template-frontmatter.sh`
- `scripts/templates/powershell/Check-TemplateFrontmatter.ps1`
- `scripts/templates/config/required-sections.json`

## Suggested Workflow

Use `implement-change` when you want the seven-question technology-agnostic path, or `research-plan-implement-validate` when the staged discovery flow is enough.

## Related Commands

- `plan`
- `test`

## Related Agents

- `planner`

## Examples

- implement target-aware install guidance for a new assistant environment
