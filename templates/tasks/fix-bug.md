---
id: fix-bug
kind: task-template
title: Fix Bug
summary: Fix a reproducible defect with regression coverage and concise root-cause notes.
category: quality
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
  - test
owner: core
generated: false
---

## Purpose

Fix a known defect with reproducible verification and minimal regression risk.

## When to Use

Use when a user-facing, developer-facing, or installer-facing bug has been
identified and needs a verified fix.

## Inputs

- bug description
- reproduction steps
- affected files or modules

## Optional Inputs

- logs
- screenshots
- prior fixes

## Constraints

- reproduce before patching
- document the failing scenario
- avoid unrelated refactors

## Expected Outputs

- bug fix
- regression test or validator coverage
- concise root-cause summary

## Acceptance Criteria

- bug can be reproduced before the change
- bug no longer reproduces after the change
- related behavior still works

## Quality Gates

- failing test or reproducible check exists before implementation
- post-fix validation passes

## Validation Tools

- `scripts/templates/shell/check-template-frontmatter.sh`
- `scripts/templates/powershell/Check-TemplateFrontmatter.ps1`
- `scripts/templates/config/required-sections.json`

## Suggested Workflow

Use `triage-reproduce-fix-verify`.

## Related Commands

- `test`

## Related Agents

- `planner`

## Examples

- fix a target mapping collision during installation
