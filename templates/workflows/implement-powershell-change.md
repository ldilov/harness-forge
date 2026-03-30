---
id: implement-powershell-change
kind: workflow-template
title: Implement PowerShell Change
summary: Deliver PowerShell work using the seeded PowerShell rules, examples, and review guidance.
mode: sequential
status: stable
version: 2
applies_to:
  - codex
  - claude-code
languages:
  - powershell
supported_targets:
  - codex
  - claude-code
supported_languages:
  - powershell
default_agents:
  - planner
owner: core
generated: false
---

## Purpose

Deliver PowerShell work with explicit use of the promoted rules and seeded examples.

## When to Use

Use when a task touches PowerShell modules, automation scripts, CI flows, or Windows tooling.

## Entry Conditions

- the affected files are known
- the dominant language is PowerShell
- `rules/common/` and `rules/powershell/` are available

## Workflow Stages

### Stage 1: Orient

**Goal**
Load the PowerShell rules and seeded references relevant to the task.

**Consumes**
- `rules/common/coding-style.md`
- `rules/powershell/coding-style.md`
- `knowledge-bases/seeded/powershell/docs/overview.md`
- `knowledge-bases/seeded/powershell/docs/examples-guide.md`

**Produces**
- selected rule set
- chosen scenario reference
- implementation constraints

**Exit Criteria**
- required PowerShell constraints are identified
- a concrete seeded scenario is chosen when one is relevant

**Failure Conditions**
- the task language is mismatched
- the seeded references are unavailable

**Next Trigger**
Move to design once the applicable rules are pinned down.

### Stage 2: Design

**Goal**
Map the change to commands, modules, automation boundaries, and tests.

**Consumes**
- `rules/common/patterns.md`
- `rules/powershell/patterns.md`
- chosen scenario from `knowledge-bases/seeded/powershell/examples/`

**Produces**
- file touch list
- verification approach
- boundary note tied to the chosen scenario

**Exit Criteria**
- automation boundaries are explicit
- verification strategy is clear

**Failure Conditions**
- operating assumptions remain ambiguous
- test strategy is missing

**Next Trigger**
Move to implementation when file-level changes are concrete.

### Stage 3: Implement

**Goal**
Apply the change following the promoted PowerShell and common rules.

**Consumes**
- selected design
- `rules/common/security.md`
- `rules/powershell/security.md`

**Produces**
- script or module changes
- updated docs if behavior changes

**Exit Criteria**
- implementation is explicit and idempotent where appropriate
- security and validation concerns are addressed

**Failure Conditions**
- script safety regresses
- automation behavior remains unclear

**Next Trigger**
Move to verification after implementation is complete.

### Stage 4: Verify

**Goal**
Check behavior against the seeded review and testing guidance.

**Consumes**
- `rules/common/testing.md`
- `rules/powershell/testing.md`
- `knowledge-bases/seeded/powershell/docs/review-checklist.md`

**Produces**
- test results
- final review notes

**Exit Criteria**
- validations are run or blockers are documented
- the review checklist is satisfied

**Failure Conditions**
- tests fail without a safe fix
- critical review issues remain

**Next Trigger**
Complete the workflow when verification is documented.

## Handoff Contracts

- record which rule files shaped the implementation
- list the validation commands that were run

## Exit Conditions

- code aligns with `rules/common/` and `rules/powershell/`
- `docs/examples-guide.md` was consulted and the nearest scenario informed the change
- relevant seeded review notes were consulted

## Failure Modes

- bypassing the promoted PowerShell rules
- shipping automation without checking review and safety guidance

## Escalation Rules

- escalate when the target execution environment is unclear
- escalate when the seeded examples do not cover the required automation pattern

## Artifacts Produced

- changed source files
- validation output
- implementation summary

## Human Approval Points

- approve any high-impact automation behavior
- approve any deviation from the seeded PowerShell guidance

## Examples

- implement a bootstrap script change using the seeded utility example
- update a CI automation flow using the seeded admin automation example
