---
id: implement-swift-change
kind: workflow-template
title: Implement Swift Change
summary: Deliver Swift work using the promoted common guidance, language rules, and structured language pack.
mode: sequential
status: stable
version: 1
applies_to:
  - codex
  - claude-code
languages:
  - swift
supported_targets:
  - codex
  - claude-code
supported_languages:
  - swift
default_agents:
  - planner
owner: core
generated: false
---

## Purpose

Deliver a Swift change with explicit use of the promoted rules, structured references, and validation steps.

## When to Use

Use when the dominant task language is Swift or when the touched files match the shipped swift pack.

## Entry Conditions

- the affected files are known
- the dominant language is Swift
- `rules/common/` and the matching language rule directory are available

## Workflow Stages

### Stage 1: Orient

**Goal**
Load the common guidance and the Swift-specific references relevant to the task.

**Consumes**
- `rules/common/`
- `skills/swift-engineering/SKILL.md`
- `knowledge-bases/structured/swift/docs/overview.md`

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
- `rules/swift/`
- `knowledge-bases/structured/swift/examples/01-reference-scenario.md`

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
- `rules/swift/security.md`

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
- `knowledge-bases/structured/swift/docs/review-checklist.md`
- `rules/swift/testing.md`
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
