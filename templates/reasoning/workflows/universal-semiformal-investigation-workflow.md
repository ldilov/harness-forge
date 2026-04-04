---
id: universal-semiformal-investigation-workflow
kind: workflow-template
title: Universal Semi-formal Investigation Workflow
summary: Standard operating workflow for evidence-backed repository investigation using semi-formal artifacts.
status: stable
version: 1
supported_targets:
  - codex
  - claude-code
supported_languages:
  - any
owner: core
generated: false
---

# Universal Semi-formal Investigation Workflow

This workflow turns the paper's reasoning pattern into a team-operable sequence.

## Purpose

Provide a team-operable sequence for structured, evidence-based investigation of code questions and change decisions.

## When to Use

Use when investigating a code question that requires structured reasoning, explicit premises, and evidence-backed conclusions.

## Goal

Drive the investigator toward:

- explicit premises
- evidence-first exploration
- traced claims
- a conclusion that behaves like a certificate

## Workflow

### Step 1 - Define the decision before exploring

Create or open:

- `templates/contracts/semiformal-core-contract.md`

Write:

- task
- decision to be made
- scope
- out-of-scope
- initial premises

Do **not** start reading random files first.

### Step 2 - Start hypothesis-led exploration

Create or open:

- `templates/logs/semiformal-exploration-log.md`

For each file request:

- state the hypothesis
- state the evidence already held
- state confidence
- state why this is the best next action

### Step 3 - Convert observations into structured evidence

As observations accumulate:

- move decisive items into the core contract's evidence ledger
- record line locations
- separate direct evidence from assumptions
- identify hidden semantics and indirection points

### Step 4 - Build traces, not summaries

If the question depends on behavior:

- trace the actual path
- follow wrappers, registrations, adapters, and helpers
- identify where behavior becomes externally visible
- note where semantics might be hidden or third-party

### Step 5 - Pick the right certificate

- patch comparison -> patch-equivalence certificate
- bug localization -> fault-localization certificate
- repo question -> code-QA certificate
- general change review -> change-safety certificate

### Step 6 - Force the opposite answer to compete

Before finalizing:

- ask what evidence would support the opposite answer
- search for that evidence
- record the result explicitly

This is one of the highest-value parts of the method.

### Step 7 - Write the formal conclusion last

The conclusion must only summarize what the artifact already established:

- what is supported
- what remains assumed
- what the decision is
- how complete the evidence is

## Decision gates

### Continue exploring if

- a decisive path has not been traced
- the opposite answer still feels plausible
- multiple root causes remain alive
- hidden semantics remain unverified

### Stop exploring if

- the decisive path is traced
- the strongest alternative is refuted or clearly bounded
- the certificate can be completed honestly
- remaining blind spots are visible and do not overturn the decision

## Review gate

A reviewer should be able to answer these questions in under 5 minutes:

- what was the task?
- what premises was the reasoning built on?
- what specific evidence was used?
- what alternative explanation was checked?
- why does the conclusion follow?

If not, the artifact is not ready.

## Entry Conditions

- A repository question, bug, or change requires evidence-backed reasoning
- The investigator is prepared to follow hypothesis-led exploration

## Workflow Stages

1. Define the decision before exploring (core contract)
2. Start hypothesis-led exploration (exploration log)
3. Convert observations into structured evidence
4. Build traces, not summaries
5. Pick the right certificate
6. Force the opposite answer to compete
7. Write the formal conclusion last

## Handoff Contracts

- Investigator produces: core contract, exploration log, relevant certificate
- Reviewer consumes: completed artifacts for review gate validation

## Exit Conditions

- Decisive path is traced
- Strongest alternative is refuted or clearly bounded
- Certificate can be completed honestly
- Remaining blind spots are visible and do not overturn the decision

## Failure Modes

- Exploring without stated hypotheses
- Claiming equivalence or safety without evidence
- Skipping alternative hypothesis check
- Writing conclusion before evidence is complete

## Escalation Rules

- If multiple root causes remain alive, continue exploring
- If hidden semantics remain unverified, escalate to a heavier certificate
- If the answer affects merge safety, use the pre-merge review workflow

## Artifacts Produced

- Semi-formal core contract
- Exploration log
- Task-specific certificate (patch-equivalence, fault-localization, code-QA, or change-safety)

## Human Approval Points

- Review gate requires a human reviewer to validate artifact completeness within 5 minutes

## Examples

_Refer to the workflow steps and decision gates above for usage examples._
