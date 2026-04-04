---
id: patch-equivalence-certificate
kind: task-template
title: Patch Equivalence Certificate
summary: Semi-formal certificate for deciding whether two patches are equivalent modulo the existing tests.
category: reasoning
status: stable
version: 1
source_alignment: appendix-a
---

# Patch Equivalence Certificate

This is the closest project-ready adaptation of the paper's Appendix A template.

Use it when the question is:

- do these two patches produce the same test outcomes?
- is an agent-generated patch equivalent to the reference patch?
- do two proposed fixes preserve behavior in the same way?

## Definition

Two patches are **equivalent modulo tests** iff executing the relevant existing test suite produces identical pass / fail outcomes for both patches.

## Constraints

- reason only about actual repository tests in scope
- distinguish fail-to-pass from pass-to-pass tests
- trace concrete behavior through code
- do not claim equivalence without either:
  - a no-counterexample argument, or
  - an explicit statement of unresolved assumptions that block the result

## Working certificate

### 1. Task and scope

- repository:
- patch 1 identifier:
- patch 2 identifier:
- problem statement / shared intent:
- tests in scope:
- files in scope:
- out of scope:

### 2. Definitions

- D1: Two patches are EQUIVALENT MODULO TESTS iff the existing repository tests produce identical pass / fail outcomes for both patches.
- D2: Relevant tests are only:
  - FAIL_TO_PASS:
  - PASS_TO_PASS:

### 3. Premises

- P1: Patch 1 modifies `[file(s)]` by `[specific change description]`
- P2: Patch 2 modifies `[file(s)]` by `[specific change description]`
- P3: The FAIL_TO_PASS tests check `[specific behavior being tested]`
- P4: The PASS_TO_PASS tests check `[specific behavior, if relevant]`
- P5: Hidden semantics that matter:
- P6: Explicit assumptions, if any:

### 4. Patch behavior summary

#### Patch 1

- changed entry points:
- helper functions touched:
- possible downstream effects:
- suspicious hidden semantics:

#### Patch 2

- changed entry points:
- helper functions touched:
- possible downstream effects:
- suspicious hidden semantics:

### 5. Analysis of FAIL_TO_PASS tests

Copy per test.

#### Test `[name]`

- Claim 1.1: With Patch 1 applied, test will PASS | FAIL because:
  - entry point:
  - traced calls:
  - decisive branch or lookup:
  - resulting behavior:
  - evidence:
- Claim 1.2: With Patch 2 applied, test will PASS | FAIL because:
  - entry point:
  - traced calls:
  - decisive branch or lookup:
  - resulting behavior:
  - evidence:
- Comparison:
  - SAME | DIFFERENT
  - reason:

### 6. Analysis of PASS_TO_PASS tests

Only include tests the patches could realistically affect.

#### Test `[name]`

- Claim 2.1: With Patch 1 applied, behavior is:
- Claim 2.2: With Patch 2 applied, behavior is:
- Comparison:
  - SAME | DIFFERENT
- Why this test matters:

### 7. Edge cases relevant to the actual tests

Only include edge cases that the real tests exercise.

#### Edge case E1

- exercised by test(s):
- Patch 1 behavior:
- Patch 2 behavior:
- Outcome same?:
- evidence:

### 8. Counterexample section

Complete **exactly one** of the following.

#### Option A - counterexample exists

- Counterexample test:
- With Patch 1:
  - PASS | FAIL
  - because:
- With Patch 2:
  - PASS | FAIL
  - because:
- Therefore:
  - patches produce different test outcomes

#### Option B - no counterexample exists

- searched tests:
- searched affected paths:
- why no differing outcome was found:
- remaining assumptions:

### 9. Alternative hypothesis check

If the opposite result were true:

- what evidence would need to exist?
- what was inspected?
- what was found?
- conclusion:
  - refuted | supported | unresolved

### 10. Formal conclusion

By Definition D1:

- Test outcomes with Patch 1:
- Test outcomes with Patch 2:
- Since outcomes are IDENTICAL | DIFFERENT, patches are EQUIVALENT | NOT EQUIVALENT modulo the existing tests.

### 11. Final answer

- ANSWER: YES | NO
- confidence:
- evidence completeness:
- unresolved blind spots:

## Review checklist

- Were both patches traced through actual definitions?
- Were fail-to-pass tests handled explicitly?
- Were pass-to-pass tests included when relevant?
- Did the analysis avoid guessing from surface diff similarity?
- Does the conclusion follow mechanically from the traced evidence?
