---
id: research-plan-implement-validate
kind: workflow-template
title: Research, Plan, Implement, Validate
summary: Sequential workflow for discovery, planning, execution, and verification.
mode: sequential
status: stable
version: 1
applies_to:
  - codex
  - claude-code
languages:
  - any
supported_targets:
  - codex
  - claude-code
supported_languages:
  - any
default_agents:
  - planner
owner: core
generated: false
---

## Purpose

Move a task from discovery to validated implementation with explicit handoffs
and a shared-runtime-aware view of repo context.

## When to Use

Use for new features, system improvements, or multi-file work that benefits from
up-front synthesis.

## Entry Conditions

- the work request is understood well enough to begin research
- relevant specs or task briefs exist

## Workflow Stages

### Stage 1: Research

**Goal**
Understand the problem, constraints, and existing repo context.

**Consumes**
- task brief
- repo context
- shared runtime summary when available
- existing docs

**Produces**
- decision notes
- risks
- assumptions
- updated understanding of which bridges and runtime surfaces matter

**Exit Criteria**
- relevant constraints are identified
- major unknowns are resolved or isolated

**Failure Conditions**
- required context is missing
- scope is still ambiguous

**Next Trigger**
Move to planning after the research notes are coherent.

### Stage 2: Plan

**Goal**
Translate research into file-level execution steps and verification strategy.

**Consumes**
- decision notes
- accepted scope
- shared runtime summary or bridge metadata when target behavior matters

**Produces**
- implementation plan
- validation strategy
- ordered task list
- explicit note on whether the root surface or scoped bridges should change

**Exit Criteria**
- file touch points are identified
- verification path is explicit

**Failure Conditions**
- no safe execution path exists
- dependencies remain unresolved

**Next Trigger**
Move to implementation after the plan is accepted.

### Stage 3: Implement

**Goal**
Apply the planned changes in dependency order.

**Consumes**
- implementation plan
- task list

**Produces**
- code or content changes
- interim verification results

**Exit Criteria**
- planned work is complete
- blockers are documented

**Failure Conditions**
- critical validation fails without a safe fix
- unexpected conflicts alter scope

**Next Trigger**
Move to validation after implementation finishes.

### Stage 4: Validate

**Goal**
Confirm the result matches the intended behavior and quality gates.

**Consumes**
- changed files
- validation plan

**Produces**
- validation report
- release or handoff recommendation

**Exit Criteria**
- required checks pass
- remaining risks are documented

**Failure Conditions**
- required checks fail
- regressions remain unresolved

**Next Trigger**
Stop after validation report is complete.

## Handoff Contracts

- Research -> Plan: decision notes, assumptions, and risk list must exist
- Plan -> Implement: file touch list, validation strategy, and shared-runtime
  touch points must exist
- Implement -> Validate: change summary and executed checks must exist

## Exit Conditions

- implementation and validation artifacts are complete
- follow-up actions are explicitly captured

## Failure Modes

- missing context
- contradictory requirements
- failing validation with no safe remediation

## Escalation Rules

- escalate when the scope changes materially
- escalate when destructive or risky changes are required

## Artifacts Produced

- research notes
- implementation plan
- validation report

## Validation Tools

- `scripts/templates/shell/verify-workflow-contracts.sh`
- `scripts/templates/powershell/Test-WorkflowContracts.ps1`

## Human Approval Points

- after planning
- before destructive changes
- after validation if residual risk remains

## Examples

- research target compatibility, plan the file changes, implement install flow, validate with smoke tests
