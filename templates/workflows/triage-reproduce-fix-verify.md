---
id: triage-reproduce-fix-verify
kind: workflow-template
title: Triage, Reproduce, Fix, Verify
summary: Iterative workflow for reproducing, fixing, and validating a defect.
mode: iterative
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

Resolve a defect by reproducing it, patching it, and validating the fix.

## When to Use

Use when a bug or regression must be understood and fixed quickly.

## Entry Conditions

- a defect report or failing scenario exists

## Workflow Stages

### Stage 1: Triage

**Goal**
Scope the bug and isolate the affected area.

**Consumes**
- bug report
- logs or reproduction notes

**Produces**
- triage notes
- impacted components

**Exit Criteria**
- affected area is identified

**Failure Conditions**
- reproduction path is unknown

**Next Trigger**
Move to reproduction after the affected area is narrowed.

### Stage 2: Reproduce

**Goal**
Capture a failing scenario before changing code.

**Consumes**
- triage notes

**Produces**
- failing check
- reproduction steps

**Exit Criteria**
- the failure is repeatable

**Failure Conditions**
- the issue cannot be reproduced

**Next Trigger**
Move to fix after the failure is stable.

### Stage 3: Fix

**Goal**
Apply the minimal safe change to correct the issue.

**Consumes**
- failing scenario
- impacted files

**Produces**
- patch
- root-cause summary

**Exit Criteria**
- patch addresses the failure path

**Failure Conditions**
- fix introduces wider regressions

**Next Trigger**
Move to verification after the patch is applied.

### Stage 4: Verify

**Goal**
Confirm the failure is gone and related behavior still works.

**Consumes**
- patch
- failing scenario

**Produces**
- passing validation
- regression notes

**Exit Criteria**
- bug no longer reproduces

**Failure Conditions**
- fix is incomplete

**Next Trigger**
Stop after verification passes.

## Handoff Contracts

- Triage -> Reproduce: impacted area and assumptions must be written down
- Reproduce -> Fix: failing scenario must be captured
- Fix -> Verify: changed files and root-cause summary must exist

## Exit Conditions

- issue no longer reproduces
- validation report exists

## Failure Modes

- unreproducible issue
- conflicting root causes
- unstable validation environment

## Escalation Rules

- escalate when reproduction is impossible with available context
- escalate when the fix requires scope expansion

## Artifacts Produced

- triage notes
- failing scenario
- patch summary
- validation report

## Validation Tools

- `scripts/templates/shell/verify-workflow-contracts.sh`
- `scripts/templates/powershell/Test-WorkflowContracts.ps1`

## Human Approval Points

- before risky fixes
- after verification if user-facing behavior changes

## Examples

- reproduce a broken template validator and patch its path handling
