---
id: implement-lua-change
kind: workflow-template
title: Implement Lua Change
summary: Deliver Lua work using the seeded Lua rules, examples, and review guidance.
mode: sequential
status: stable
version: 1
applies_to:
  - codex
  - claude-code
languages:
  - lua
supported_targets:
  - codex
  - claude-code
supported_languages:
  - lua
default_agents:
  - planner
owner: core
generated: false
---

## Purpose

Deliver Lua work with explicit use of the promoted rules and seeded examples.

## When to Use

Use when a task touches Lua modules, plugins, OpenResty, Love2D, or embedded scripting.

## Entry Conditions

- the affected files are known
- the dominant language is Lua
- `rules/common/` and `rules/lua/` are available

## Workflow Stages

### Stage 1: Orient

**Goal**
Load the Lua rules and seeded references relevant to the task.

**Consumes**
- `rules/common/coding-style.md`
- `rules/lua/coding-style.md`
- `knowledge-bases/seeded/lua/docs/overview.md`

**Produces**
- selected rule set
- implementation constraints

**Exit Criteria**
- required Lua constraints are identified
- an example path is chosen if one is relevant

**Failure Conditions**
- the task language is mismatched
- the seeded references are unavailable

**Next Trigger**
Move to design once the applicable rules are pinned down.

### Stage 2: Design

**Goal**
Map the change to modules, runtime boundaries, and tests.

**Consumes**
- `rules/common/patterns.md`
- `rules/lua/patterns.md`
- `knowledge-bases/seeded/lua/examples/`

**Produces**
- file touch list
- verification approach

**Exit Criteria**
- module boundaries are explicit
- runtime assumptions are clear

**Failure Conditions**
- runtime choice remains ambiguous
- test strategy is missing

**Next Trigger**
Move to implementation when file-level changes are concrete.

### Stage 3: Implement

**Goal**
Apply the change following the promoted Lua and common rules.

**Consumes**
- selected design
- `rules/common/security.md`
- `rules/lua/security.md`

**Produces**
- code changes
- updated docs if behavior changes

**Exit Criteria**
- implementation matches the selected runtime pattern
- security and validation concerns are addressed

**Failure Conditions**
- compatibility regresses
- the implementation diverges from the selected pattern

**Next Trigger**
Move to verification after implementation is complete.

### Stage 4: Verify

**Goal**
Check behavior against the seeded review and testing guidance.

**Consumes**
- `rules/common/testing.md`
- `rules/lua/testing.md`
- `knowledge-bases/seeded/lua/docs/review-checklist.md`

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

- code aligns with `rules/common/` and `rules/lua/`
- relevant seeded examples or review notes were consulted

## Failure Modes

- bypassing the promoted Lua rules
- shipping runtime-specific code without checking seeded examples

## Escalation Rules

- escalate when the target runtime is not covered by the seeded pack
- escalate when the seeded examples do not cover the required pattern

## Artifacts Produced

- changed source files
- validation output
- implementation summary

## Human Approval Points

- approve any runtime-specific deviation from the seeded Lua guidance
- approve any major change in module or plugin structure

## Examples

- implement a Neovim plugin feature using the seeded plugin example
- update an OpenResty handler using the seeded request-handler example
