---
id: fault-localization-certificate
kind: task-template
title: Fault Localization Certificate
summary: Semi-formal certificate for localizing the most likely buggy region from failing-test behavior.
category: reasoning
status: stable
version: 1
source_alignment: appendix-b
---

# Fault Localization Certificate

This certificate preserves the paper's four-phase structure:

1. test semantics analysis
2. code path tracing
3. divergence analysis
4. ranked predictions

## Use when

- a failing test exists but the buggy line is unknown
- the failure manifests in one place but may originate elsewhere
- you need ranked candidate regions with evidence

## Inputs

- failing test name
- failing test code
- available source files
- any known passing tests
- optional stack signal or symptom description

## Required rule

Every ranked prediction must trace back through a **CLAIM** and that claim must trace back to a **PREMISE**.

## Certificate

### Phase 1 - test semantics analysis

- What does the failing test do step by step?
- What are the explicit assertions or expected exceptions?
- What is the expected behavior versus the observed failure mode?

#### Formal premises

- PREMISE T1:
- PREMISE T2:
- PREMISE T3:
- PREMISE T4:

### Phase 2 - code path tracing

Build the path from test entry point into production code.

#### Call sequence

| Step | Method / Function | File:Line | Behavior | Why Relevant |
|---|---|---|---|---|
| 1 | `[symbol]` | `[file:line]` | `[what it does]` | `[relation to test]` |
| 2 | `[symbol]` | `[file:line]` | `[what it does]` | `[relation to test]` |

#### Significant observations

- O1:
  - location:
  - observation:
  - why it matters:
- O2:
  - location:
  - observation:
  - why it matters:

#### Indirection check

- registration / factory / config / metadata path involved?:
- hidden collaborator or adapter involved?:
- state mutation path involved?:
- multiple files likely involved?:

### Phase 3 - divergence analysis

For each candidate divergence between expected and actual behavior:

- CLAIM D1:
  - location:
  - code behavior:
  - which premise it contradicts:
  - why:
  - evidence:
- CLAIM D2:
  - location:
  - code behavior:
  - which premise it contradicts:
  - why:
  - evidence:

### Competing hypotheses

- H1:
  - statement:
  - supporting evidence:
  - contradictory evidence:
  - status: plausible | weakened | refuted
- H2:
  - statement:
  - supporting evidence:
  - contradictory evidence:
  - status:
- H3:
  - statement:
  - supporting evidence:
  - contradictory evidence:
  - status:

### Phase 4 - ranked predictions

Each prediction must cite the supporting claim(s).

#### Rank 1

- location:
- candidate region:
- why it is likely:
- supported by claims:
- confidence:
- root cause or crash site?:

#### Rank 2

- location:
- candidate region:
- why it is likely:
- supported by claims:
- confidence:
- root cause or crash site?:

#### Rank 3

- location:
- candidate region:
- why it is likely:
- supported by claims:
- confidence:
- root cause or crash site?:

#### Rank 4

- location:
- candidate region:
- why it is likely:
- supported by claims:
- confidence:
- root cause or crash site?:

#### Rank 5

- location:
- candidate region:
- why it is likely:
- supported by claims:
- confidence:
- root cause or crash site?:

### Exploration log linkage

Link the live exploration record here:

- exploration log path:
- most important confirmed hypothesis:
- most important refuted hypothesis:
- unresolved uncertainty still affecting ranking:

### Alternative root-cause check

If Rank 1 is wrong, which other candidate best explains the failure, and what evidence would decide between them?

- alternative candidate:
- distinguishing evidence needed:
- current status:

### Formal conclusion

- Most likely root cause:
- Best alternative:
- Why the top prediction outranks the crash site or symptom location:
- Final ranked list:
- Evidence completeness:
- unresolved blind spots:

## Structured exploration format

Use `templates/logs/semiformal-exploration-log.md` while filling this certificate.
Do not retroactively invent the exploration record.
