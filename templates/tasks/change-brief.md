---
id: change-brief
kind: task-template
title: Change Brief
summary: Frame a technology-agnostic engineering change with explicit scope, invariants, risks, validation, rollback, and durable memory.
category: planning
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

Turn a vague request into a bounded engineering change with enough structure to
implement safely across any language, framework, or runtime.

## When to Use

Use when the task is still underspecified, when the blast radius is not yet
clear, or when the team needs a stable brief before planning or coding.

## Inputs

- user request, ticket, or task brief
- repo or system context
- known constraints, deadlines, and stakeholders

## Optional Inputs

- prior incidents or regressions
- screenshots, logs, or traces
- linked design docs, ADRs, or specs

## Constraints

- separate the requested solution from the underlying problem
- state assumptions explicitly instead of hiding them in prose
- keep the first pass small enough to remain reviewable and reversible

## Expected Outputs

- clear change statement
- explicit rationale and success criteria
- initial risk and rollback notes
- durable summary that another engineer can reuse later

## Acceptance Criteria

- the brief answers all seven core engineering questions
- scope and non-goals are explicit
- affected areas and main risks are called out
- the change can move into planning without hidden assumptions

## Quality Gates

- the brief names what must remain true before implementation starts
- the brief identifies how success will be measured, not just what will be built
- the brief captures a rollback posture proportional to the risk

## Validation Tools

- `scripts/templates/shell/check-template-frontmatter.sh`
- `scripts/templates/powershell/Check-TemplateFrontmatter.ps1`
- `scripts/templates/config/required-sections.json`

## Suggested Workflow

Use `implement-change`.

## Related Commands

- `plan`
- `test`

## Related Agents

- `planner`

## Examples

- define the smallest safe change for replacing a cache layer
- frame an installer update that must preserve existing workspace state

## Working Template

### What is changing?

- requested change:
- affected user or operator behavior:
- affected files, modules, or services:
- explicitly out of scope:

### Why is it changing?

- user, business, or operational driver:
- current pain or failure mode:
- urgency or deadline:

### What must remain true?

- invariants to preserve:
- compatibility requirements:
- performance, security, or data guarantees that cannot regress:

### What could break?

- likely regressions:
- hidden coupling or dependency risks:
- migration, rollout, or operability risks:

### How will we know it works?

- primary success criteria:
- required evidence:
- minimum validation set:

### How do we roll it back?

- rollback trigger:
- fallback path:
- cleanup required after rollback:

### What should future engineers remember?

- trade-offs accepted:
- follow-up work or monitoring needs:
- links to ADRs, specs, or related decisions:
