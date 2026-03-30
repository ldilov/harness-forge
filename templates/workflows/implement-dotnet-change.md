---
id: implement-dotnet-change
kind: workflow-template
title: Implement .NET Change
summary: Deliver .NET work using the seeded .NET rules, examples, and review guidance.
mode: sequential
status: stable
version: 2
applies_to:
  - codex
  - claude-code
languages:
  - dotnet
supported_targets:
  - codex
  - claude-code
supported_languages:
  - dotnet
default_agents:
  - planner
owner: core
generated: false
---

## Purpose

Deliver .NET work with explicit use of the promoted rules and seeded examples.

## When to Use

Use when a task touches C#, ASP.NET Core, workers, libraries, or .NET CLI code.

## Entry Conditions

- the affected files are known
- the dominant language is .NET or C#
- `rules/common/` and `rules/dotnet/` are available

## Workflow Stages

### Stage 1: Orient

**Goal**
Load the .NET rules and seeded references relevant to the task.

**Consumes**
- `rules/common/coding-style.md`
- `rules/dotnet/coding-style.md`
- `knowledge-bases/seeded/dotnet/docs/overview.md`
- `knowledge-bases/seeded/dotnet/docs/examples-guide.md`

**Produces**
- selected rule set
- chosen scenario reference
- implementation constraints

**Exit Criteria**
- required .NET constraints are identified
- a concrete seeded scenario is chosen when one is relevant

**Failure Conditions**
- the task language is mismatched
- the seeded references are unavailable

**Next Trigger**
Move to design once the applicable rules are pinned down.

### Stage 2: Design

**Goal**
Map the change to services, workers, contracts, and tests.

**Consumes**
- `rules/common/patterns.md`
- `rules/dotnet/patterns.md`
- chosen scenario from `knowledge-bases/seeded/dotnet/examples/`

**Produces**
- file touch list
- verification approach
- boundary note tied to the chosen scenario

**Exit Criteria**
- dependency direction is explicit
- verification strategy is clear

**Failure Conditions**
- structure remains ambiguous
- test strategy is missing

**Next Trigger**
Move to implementation when file-level changes are concrete.

### Stage 3: Implement

**Goal**
Apply the change following the promoted .NET and common rules.

**Consumes**
- selected design
- `rules/common/security.md`
- `rules/dotnet/security.md`

**Produces**
- code changes
- updated docs if behavior changes

**Exit Criteria**
- implementation follows the planned structure
- security and validation concerns are addressed

**Failure Conditions**
- layering or runtime compatibility regresses
- validation is incomplete

**Next Trigger**
Move to verification after implementation is complete.

### Stage 4: Verify

**Goal**
Check behavior against the seeded review and testing guidance.

**Consumes**
- `rules/common/testing.md`
- `rules/dotnet/testing.md`
- `knowledge-bases/seeded/dotnet/docs/review-checklist.md`

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

- code aligns with `rules/common/` and `rules/dotnet/`
- `docs/examples-guide.md` was consulted and the nearest scenario informed the change
- relevant seeded review notes were consulted

## Failure Modes

- bypassing the promoted .NET rules
- shipping service or worker changes without seeded review coverage

## Escalation Rules

- escalate when runtime or framework constraints conflict with the promoted guidance
- escalate when the seeded examples do not cover the required architecture

## Artifacts Produced

- changed source files
- validation output
- implementation summary

## Human Approval Points

- approve any major runtime or hosting model change
- approve any deviation from the seeded .NET guidance

## Examples

- add an ASP.NET Core endpoint using the seeded CRUD API example
- implement a background worker change using the queue-processing example
