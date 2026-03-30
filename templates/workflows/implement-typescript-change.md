---
id: implement-typescript-change
kind: workflow-template
title: Implement TypeScript Change
summary: Deliver TypeScript or JavaScript work using the seeded TypeScript rules, examples, and review guidance.
mode: sequential
status: stable
version: 2
applies_to:
  - codex
  - claude-code
languages:
  - typescript
supported_targets:
  - codex
  - claude-code
supported_languages:
  - typescript
default_agents:
  - planner
owner: core
generated: false
---

## Purpose

Deliver TypeScript or JavaScript work with explicit use of the promoted rules
and seeded examples.

## When to Use

Use when a task touches TypeScript, JavaScript, Node.js, React, or Next.js code.

## Entry Conditions

- the affected files are known
- the dominant language is TypeScript or JavaScript
- `rules/common/` and `rules/typescript/` are available

## Workflow Stages

### Stage 1: Orient

**Goal**
Load the TypeScript rules and seeded references relevant to the task.

**Consumes**
- `rules/common/coding-style.md`
- `rules/typescript/coding-style.md`
- `knowledge-bases/seeded/typescript/docs/overview.md`
- `knowledge-bases/seeded/typescript/docs/examples-guide.md`

**Produces**
- selected rule set
- chosen scenario reference
- implementation constraints

**Exit Criteria**
- required TypeScript constraints are identified
- a concrete seeded scenario is chosen when one is relevant

**Failure Conditions**
- the task language is mismatched
- the seeded references are unavailable

**Next Trigger**
Move to design once the applicable rules are pinned down.

### Stage 2: Design

**Goal**
Map the change to modules, types, validation, and tests.

**Consumes**
- `rules/common/patterns.md`
- `rules/typescript/patterns.md`
- chosen scenario from `knowledge-bases/seeded/typescript/examples/`

**Produces**
- file touch list
- verification approach
- boundary note tied to the chosen scenario

**Exit Criteria**
- module boundaries are explicit
- validation and typing strategy are clear

**Failure Conditions**
- types or boundaries remain ambiguous
- test strategy is missing

**Next Trigger**
Move to implementation when file-level changes are concrete.

### Stage 3: Implement

**Goal**
Apply the change following the promoted TypeScript and common rules.

**Consumes**
- selected design
- `rules/common/security.md`
- `rules/typescript/security.md`

**Produces**
- code changes
- updated docs if behavior changes

**Exit Criteria**
- code matches the planned structure
- security and validation concerns are addressed

**Failure Conditions**
- type safety regresses
- the implementation diverges from the selected pattern

**Next Trigger**
Move to verification after implementation is complete.

### Stage 4: Verify

**Goal**
Check behavior against the seeded review and testing guidance.

**Consumes**
- `rules/common/testing.md`
- `rules/typescript/testing.md`
- `knowledge-bases/seeded/typescript/docs/review-checklist.md`

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

- the changed files align with the selected TypeScript or JavaScript patterns
- validation is complete or the remaining blockers are explicit
- the final summary names the rule files, examples, and review cues that guided the work

## Failure Modes

- skipping root rules and relying only on ad hoc implementation
- ignoring the seeded review checklist before completion

## Escalation Rules

- escalate when the task requires a framework pattern not covered by the seeded pack
- escalate when type or build constraints conflict with the promoted rules

## Artifacts Produced

- changed source files
- validation output
- implementation summary

## Human Approval Points

- approve any major architecture shift
- approve any deviation from the seeded TypeScript guidance

## Examples

- refactor a Node CLI command using the Node API example pack
- implement a new React component flow using the seeded component guidance
