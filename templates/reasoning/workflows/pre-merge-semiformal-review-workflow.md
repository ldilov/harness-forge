---
id: pre-merge-semiformal-review-workflow
kind: workflow-template
title: Pre-merge Semi-formal Review Workflow
summary: Lightweight governance workflow that applies semi-formal certificates to risky engineering changes before merge.
status: stable
version: 1
---

# Pre-merge Semi-formal Review Workflow

## Purpose

Make merge decisions depend on evidence-backed reasoning instead of persuasive prose.

## When to trigger

Require this workflow for changes that are:

- correctness-sensitive
- cross-cutting
- security-relevant
- migration-related
- behavior-preserving refactors
- test-sparse but high-impact
- difficult to execute locally
- likely to hide lifecycle or registration regressions

## Required pre-merge artifacts

At minimum:

- semi-formal core contract
- exploration log
- one relevant certificate

For higher-risk changes:

- change-safety certificate
- task-specific certificate if applicable
- explicit rollback trigger

## Merge checklist

### 1. Problem framing

- Is the intended behavior explicit?
- Are preserved invariants named?
- Is the system boundary clear?

### 2. Evidence quality

- Are evidence items specific and location-backed?
- Were actual code paths traced?
- Did the reviewer spot-check at least one decisive trace?

### 3. Counterexample pressure

- Was a plausible counterexample actively searched for?
- If none was found, is the no-counterexample section credible?
- Were hidden semantics or third-party assumptions surfaced?

### 4. Conclusion quality

- Does the final recommendation match the body?
- Are unresolved assumptions visible?
- Is evidence completeness stated honestly?

## Merge outcomes

### Safe to merge

Use only when:

- critical paths were traced
- no strong alternative explanation remains
- unresolved assumptions are minor

### Safe with conditions

Use when:

- core claim is well supported
- some assumptions remain
- follow-up validation or runtime guard is required

### Not yet safe

Use when:

- critical path is untraced
- plausible alternative explanation remains
- a counterexample exists
- the conclusion depends on hidden semantics that were never inspected

## Reviewer comment pattern

Use this structure for review comments:

- strongest evidence in favor:
- strongest unresolved concern:
- counterexample status:
- merge recommendation:
- what would change the decision fastest:
