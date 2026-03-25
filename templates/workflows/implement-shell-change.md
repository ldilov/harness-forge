---
id: implement-shell-change
kind: workflow-template
title: Implement Shell Change
summary: Deliver Shell work using the promoted common guidance, language rules, and structured language pack.
mode: sequential
status: stable
version: 1
applies_to:
  - codex
  - claude-code
languages:
  - shell
supported_targets:
  - codex
  - claude-code
supported_languages:
  - shell
default_agents:
  - planner
owner: core
generated: false
---

## Purpose

Deliver a Shell change with explicit use of the promoted rules, structured references, and validation steps.

## When to Use

Use when the dominant task language is Shell or when the touched files match the shipped shell pack.

## Entry Conditions

- the affected files are known
- the dominant language is Shell
- `rules/common/` and the matching language rule directory are available

## Workflow Stages

### Stage 1: Orient

**Goal**
Load the common guidance and the Shell-specific references relevant to the task.

**Consumes**
- `rules/common/`
- `skills/shell-engineering/SKILL.md`
- `knowledge-bases/structured/shell/docs/overview.md`

**Produces**
- selected rule set
- implementation constraints

**Exit Criteria**
- the applicable guidance is identified
- the validation path is known

**Failure Conditions**
- the task language is mismatched
- the structured references are unavailable

**Next Trigger**
Move to design once the active rules and examples are pinned down.

### Stage 2: Design

**Goal**
Map the change to modules, boundaries, validation, and tests.

**Consumes**
- `rules/common/`
- `rules/shell/`
- `knowledge-bases/structured/shell/examples/01-reference-scenario.md`

**Produces**
- file touch list
- verification approach

**Exit Criteria**
- file-level intent is explicit
- the test or review path is clear

**Failure Conditions**
- dependencies or boundaries remain ambiguous
- no workable validation path exists

**Next Trigger**
Move to implementation when the change is concrete enough to execute safely.

### Stage 3: Implement

**Goal**
Apply the change following the promoted guidance.

**Consumes**
- selected design
- `rules/common/security.md`
- `rules/shell/security.md`

**Produces**
- code or script changes
- updated docs if behavior changes

**Exit Criteria**
- the implementation matches the intended design
- obvious safety checks are addressed

**Failure Conditions**
- the implementation diverges from the selected pattern
- a blocking compile or runtime issue appears without a safe fix

**Next Trigger**
Move to verification after the implementation compiles or is otherwise ready to validate.

### Stage 4: Verify

**Goal**
Validate behavior against the structured review and testing guidance.

**Consumes**
- `knowledge-bases/structured/shell/docs/review-checklist.md`
- `rules/shell/testing.md`
- repo-specific build or test commands

**Produces**
- validation results
- release notes or follow-up tasks if needed

**Exit Criteria**
- the intended behavior is verified
- outstanding follow-ups are captured clearly

**Failure Conditions**
- tests fail without a safe remediation path
- the change introduces a release-blocking regression

**Next Trigger**
End the workflow or hand off follow-up tasks.

## Handoff Contracts

- record which `rules/common/` and `rules/shell/` files were applied
- note the commands or manual checks used to validate the change

## Exit Conditions

- the implementation aligns with the promoted shell rules and structured references
- verification results or blockers are captured clearly

## Failure Modes

- changing command semantics or platform assumptions without checking the shell rules first
- finishing without running or documenting the repo's verification path

## Escalation Rules

- escalate when portability, shell compatibility, or destructive operations are unclear
- escalate when deployment scripts affect production-like environments

## Artifacts Produced

- changed scripts
- validation output
- implementation summary

## Human Approval Points

- approve destructive operation changes
- approve deviations from the promoted shell safety conventions

## Examples

- harden a bootstrap script and verify behavior in dry-run mode
- refactor shell helper functions using the structured reference scenario
