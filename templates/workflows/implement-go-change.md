---
id: implement-go-change
kind: workflow-template
title: Implement Go Change
summary: Deliver Go work using the promoted common guidance, language rules, and structured language pack.
mode: sequential
status: stable
version: 1
applies_to:
  - codex
  - claude-code
languages:
  - go
supported_targets:
  - codex
  - claude-code
supported_languages:
  - go
default_agents:
  - planner
owner: core
generated: false
---

## Purpose

Deliver a Go change with explicit use of the promoted rules, structured references, and validation steps.

## When to Use

Use when the dominant task language is Go or when the touched files match the shipped go pack.

## Entry Conditions

- the affected files are known
- the dominant language is Go
- `rules/common/` and the matching language rule directory are available

## Workflow Stages

### Stage 1: Orient

**Goal**
Load the common guidance and the Go-specific references relevant to the task.

**Consumes**
- `rules/common/`
- `skills/go-engineering/SKILL.md`
- `knowledge-bases/structured/go/docs/overview.md`

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
- `rules/golang/`
- `knowledge-bases/structured/go/examples/01-reference-scenario.md`

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
- `rules/golang/security.md`

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
- `knowledge-bases/structured/go/docs/review-checklist.md`
- `rules/golang/testing.md`
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

- record which `rules/common/` and `rules/golang/` files were applied
- note the commands or manual checks used to validate the change

## Exit Conditions

- the implementation aligns with the promoted Go rules and structured references
- verification results or blockers are captured clearly

## Failure Modes

- changing package or concurrency boundaries without checking the Go rules first
- finishing without running or documenting the repo's verification path

## Escalation Rules

- escalate when the task needs cross-service or protocol guidance not covered by the pack
- escalate when module or API boundaries stay ambiguous after the design stage

## Artifacts Produced

- changed source files
- validation output
- implementation summary

## Human Approval Points

- approve architecture shifts across packages or service boundaries
- approve deviations from the promoted Go conventions

## Examples

- add a new CLI command while keeping package boundaries explicit
- implement an HTTP handler change using the structured Go reference scenario
