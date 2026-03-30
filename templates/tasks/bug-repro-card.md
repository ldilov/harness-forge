---
id: bug-repro-card
kind: task-template
title: Bug Repro Card
summary: Reduce a defect to a minimal, shareable reproduction with explicit expectations, suspects, and next discriminating checks.
category: diagnosis
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

Capture a defect in a way that makes debugging reproducible, reviewable, and
safe to hand off without re-explaining the issue.

## When to Use

Use when a bug report is noisy, intermittent, cross-cutting, or expensive to
keep rediscovering from scratch.

## Inputs

- observed behavior
- expected behavior
- environment or runtime context

## Optional Inputs

- logs, traces, or screenshots
- commit or deployment window
- prior related fixes or incidents

## Constraints

- distinguish observation from hypothesis
- minimize the reproduction before broad refactoring begins
- preserve the failing inputs, state, or timing conditions when possible

## Expected Outputs

- reproducible scenario
- narrowed scope or suspects
- next discriminating check
- handoff-ready bug summary

## Acceptance Criteria

- the bug is described in observable terms
- the repro steps can be run by another engineer
- likely suspects are narrower than the full system
- the next debugging move is obvious

## Quality Gates

- reproduction distinguishes expected from actual behavior
- hypotheses are clearly labeled and testable
- missing environment details are listed instead of guessed

## Validation Tools

- `scripts/templates/shell/check-template-frontmatter.sh`
- `scripts/templates/powershell/Check-TemplateFrontmatter.ps1`
- `scripts/templates/config/required-sections.json`

## Suggested Workflow

Use `triage-reproduce-fix-verify`, optionally followed by `implement-change` if the fix broadens into a larger change.

## Related Commands

- `test`

## Related Agents

- `planner`

## Examples

- isolate an intermittent installer state rewrite failure
- reduce a race condition to a repeatable timing window

## Working Template

### What is changing?

- failing surface or behavior:
- current scope of suspected components:

### Why is it changing?

- why the defect matters now:
- suspected trigger window or recent change:

### What must remain true?

- expected behavior:
- user or system guarantees that should hold:

### What could break?

- adjacent flows likely to share the same root cause:
- data, performance, or availability risks while debugging:

### How will we know it works?

- exact repro steps:
- expected result:
- observed result:
- next discriminating check:

### How do we roll it back?

- temporary mitigation or feature flag:
- safe fallback while the bug remains open:

### What should future engineers remember?

- conditions needed to reproduce:
- misleading signals or dead-end hypotheses:
- permanent regression test or alert to add later:
