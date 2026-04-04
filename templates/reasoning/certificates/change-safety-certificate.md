---
id: change-safety-certificate
kind: task-template
title: Change Safety Certificate
summary: Generalized semi-formal certificate for deciding whether a proposed change is safe enough to implement or merge.
category: reasoning
status: stable
version: 1
generalization_note: Preserves the paper's certificate logic while adapting it from benchmark tasks to real engineering change review.
---

# Change Safety Certificate

This is the universal engineering generalization of the paper's semi-formal method.

Use it for:

- feature changes
- bug fixes
- refactors
- config changes
- migration logic
- middleware / lifecycle changes
- review signoff on risky edits

The point is not to predict every runtime fact.
The point is to require evidence before making claims about preserved or changed behavior.

## Required invariants

- the change must be described as behavior, not just code movement
- impacted paths must be traced
- regression risk must be tied to explicit evidence or uncertainty
- the opposite conclusion ("unsafe" or "safe") must be examined
- the final recommendation must distinguish:
  - proven safe
  - likely safe but assumed
  - unresolved risk

## Certificate

### 1. Change statement

- change title:
- change type:
  - feature | fix | refactor | migration | config | cleanup | performance
- why the change exists:
- target behavior after change:
- intended non-goals:

### 2. Definitions and boundaries

- D1: "safe" for this change means:
- D2: user-visible behavior in scope:
- D3: hidden system behavior in scope:
- D4: explicit out-of-scope behavior:

### 3. Premises

- P1: current behavior:
- P2: proposed change touches:
- P3: critical paths likely affected:
- P4: known invariants to preserve:
- P5: assumptions:
- P6: external semantics relied on:

### 4. Evidence ledger

- E1:
  - location:
  - observation:
  - why it matters:
- E2:
  - location:
  - observation:
  - why it matters:
- E3:
  - location:
  - observation:
  - why it matters:

### 5. Affected-path tracing

#### Path A

- entry point:
- intermediate calls / wiring:
- decisive state or config:
- externally visible effect:
- change impact:
- evidence:

#### Path B

- entry point:
- intermediate calls / wiring:
- decisive state or config:
- externally visible effect:
- change impact:
- evidence:

### 6. Preserved-behavior claims

- CLAIM S1:
  - statement:
  - evidence:
  - assumptions:
  - confidence:
- CLAIM S2:
  - statement:
  - evidence:
  - assumptions:
  - confidence:

### 7. Changed-behavior claims

- CLAIM C1:
  - statement:
  - evidence:
  - intended?:
  - validation path:
- CLAIM C2:
  - statement:
  - evidence:
  - intended?:
  - validation path:

### 8. Regression hypotheses

List ways the change could still be wrong.

- H1:
  - what could break:
  - why plausible:
  - evidence for:
  - evidence against:
  - status:
- H2:
  - what could break:
  - why plausible:
  - evidence for:
  - evidence against:
  - status:
- H3:
  - what could break:
  - why plausible:
  - evidence for:
  - evidence against:
  - status:

### 9. Counterexample or no-counterexample section

#### Counterexample found

- scenario:
- affected path:
- observed or predicted difference:
- severity:
- implication:
  - unsafe until addressed

#### Or - no counterexample found yet

- searched paths:
- searched edge cases:
- why no harmful divergence was found:
- what remains unverified:

### 10. Alternative hypothesis check

If the opposite recommendation were true:

- what evidence would need to exist?
- what did we inspect?
- what did we actually find?
- result:
  - refuted | supported | unresolved

### 11. Formal conclusion

- proven preserved behaviors:
- proven changed behaviors:
- unresolved assumptions:
- risk level:
  - low | medium | high
- recommendation:
  - safe to merge
  - safe with conditions
  - not yet safe
- required follow-up:
- rollback trigger:

## Review checklist

- Did the certificate separate preserved vs changed behavior?
- Were affected paths traced through real code and wiring?
- Were regression hypotheses explored, not just listed?
- Is the merge recommendation derivable from the evidence above?
