---
id: verification-matrix
kind: task-template
title: Verification Matrix
summary: Map risks to evidence so validation stays proportional, explicit, and reusable across technologies.
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

Turn abstract confidence into a concrete matrix of risks, checks, evidence, and
residual uncertainty.

## When to Use

Use when a change crosses multiple files, contracts, or operational boundaries,
or when reviewers need a crisp statement of what was checked and what remains
uncertain.

## Inputs

- change brief
- correctness contract
- current implementation or diff summary

## Optional Inputs

- production metrics or baselines
- benchmark results
- manual QA notes

## Constraints

- choose the cheapest evidence that still proves the important claim
- do not treat every check as equally important
- separate required evidence from nice-to-have evidence

## Expected Outputs

- risk-to-evidence table
- required versus optional checks
- residual-risk note
- release recommendation inputs

## Acceptance Criteria

- each significant risk has an evidence plan
- blockers are clearly separated from advisory checks
- confidence level is justified by evidence, not optimism

## Quality Gates

- high-severity risks have at least one direct validation method
- manual-only validation is called out explicitly when automation is absent
- missing evidence is surfaced before release sign-off

## Validation Tools

- `scripts/templates/shell/check-template-frontmatter.sh`
- `scripts/templates/powershell/Check-TemplateFrontmatter.ps1`
- `scripts/templates/config/required-sections.json`

## Suggested Workflow

Use `implement-change` and complete this matrix before handoff or release.

## Related Commands

- `test`

## Related Agents

- `planner`

## Examples

- map migration risks to dry runs, backfill checks, and rollback probes
- tie a refactor to regression tests, snapshots, and manual smoke checks

## Working Template

### What is changing?

- change summary:
- boundaries touched:

### Why is it changing?

- reason validation depth matters here:
- cost of being wrong:

### What must remain true?

- top invariants that require evidence:

### What could break?

| Risk | Severity | Likely trigger | Owner |
| --- | --- | --- | --- |
| example regression | high | edge-case parsing path | engineering |

### How will we know it works?

| Claim to prove | Required evidence | Check type | Result | Confidence note |
| --- | --- | --- | --- | --- |
| behavior is preserved | regression suite | automated test | pending | blocks ship until green |

### How do we roll it back?

- rollback signal to watch during validation:
- fallback evidence to collect after rollback:

### What should future engineers remember?

- missing automation to add later:
- signals that were most predictive:
- checks that looked expensive but paid off:
