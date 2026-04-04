---
id: universal-semiformal-investigation-workflow
kind: workflow-template
title: Universal Semi-formal Investigation Workflow
summary: Standard operating workflow for evidence-backed repository investigation using semi-formal artifacts.
status: stable
version: 1
---

# Universal Semi-formal Investigation Workflow

This workflow turns the paper's reasoning pattern into a team-operable sequence.

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
