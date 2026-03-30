---
id: release-gate-report
kind: task-template
title: Release Gate Report
summary: Summarize ship readiness with blockers, evidence, rollback posture, and follow-up memory for future releases.
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
  - test
owner: core
generated: false
---

## Purpose

Answer the only question that matters near the end of a change: is this safe
enough to ship now, and if not, what still blocks it?

## When to Use

Use before release, handoff, rollout, migration cutover, or any change where a
clear go/no-go decision is more valuable than another round of raw notes.

## Inputs

- change brief
- correctness contract
- verification matrix

## Optional Inputs

- rollout plan
- observability dashboards or alerts
- incident history for the affected area

## Constraints

- blockers must be concrete and actionable
- warnings must be distinguished from blockers
- residual risk must not be hidden in status prose

## Expected Outputs

- go / no-go recommendation
- blockers, warnings, and follow-up actions
- evidence summary
- rollback readiness statement

## Acceptance Criteria

- the report makes the release decision legible in one pass
- evidence is tied to stated risks
- rollback posture is explicit for the highest-risk path
- unresolved risks are owned and dated when possible

## Quality Gates

- required validations are complete or explicitly blocking
- no critical unknowns remain hidden under a green status
- rollback steps are realistic for the release shape

## Validation Tools

- `scripts/templates/shell/check-template-frontmatter.sh`
- `scripts/templates/powershell/Check-TemplateFrontmatter.ps1`
- `scripts/templates/config/required-sections.json`

## Suggested Workflow

Use `implement-change` and finish with this report.

## Related Commands

- `test`

## Related Agents

- `planner`

## Examples

- decide whether an installer refresh can ship without discarding runtime state
- sign off a data migration behind a staged rollout gate

## Working Template

### What is changing?

- release scope:
- user or operator impact:
- target environments:

### Why is it changing?

- reason for shipping now:
- risk of delaying versus shipping:

### What must remain true?

- release-critical guarantees:
- compatibility or uptime promises:

### What could break?

- blocker risks:
- warning-level risks:
- dependencies outside this release team's control:

### How will we know it works?

- checks completed:
- remaining checks:
- production or rollout signals to watch:
- go / no-go recommendation:

### How do we roll it back?

- rollback owner:
- rollback trigger:
- rollback path:
- expected recovery time or steps:

### What should future engineers remember?

- lessons for the next release:
- permanent automation or monitoring gaps:
- links to follow-up tasks, ADRs, or incident notes:
