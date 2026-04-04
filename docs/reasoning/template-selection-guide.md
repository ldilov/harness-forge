---
id: template-selection-guide
kind: documentation
title: Template Selection Guide
summary: Choose the smallest semi-formal surface that still preserves evidence discipline.
status: stable
version: 1
---

# Template Selection Guide

Use the smallest template that still forces the right reasoning behavior.

## Choose by task

| Task | Primary template | Supporting surfaces |
|---|---|---|
| Are two patches or solutions behaviorally the same? | `templates/certificates/patch-equivalence-certificate.md` | exploration log, function trace, data flow |
| Which line or region most likely causes the failing test? | `templates/certificates/fault-localization-certificate.md` | exploration log |
| Answer a repo question with real code evidence | `templates/certificates/code-question-answering-certificate.md` | function trace, data flow ledger |
| Assess whether a proposed change is safe to merge | `templates/certificates/change-safety-certificate.md` | core contract, exploration log |
| Do a fast but disciplined investigation | `templates/contracts/semiformal-core-contract.md` | exploration log |
| Trace confusing behavior across files | exploration log + function trace | optionally change-safety certificate |

## Choose by risk

### Low risk

Use:

- core contract
- short exploration log
- concise conclusion

### Medium risk

Use:

- core contract
- exploration log
- change-safety certificate or code-QA certificate

### High risk

Use:

- exploration log
- task-specific certificate
- counterexample or no-counterexample argument
- reviewer signoff on evidence spine

## Choose by uncertainty source

### Surface similarity may be misleading

Use patch equivalence certificate.

### Failure appears at one location but may originate elsewhere

Use fault localization certificate.

### The question depends on repo-specific semantics

Use code-QA certificate.

### The change touches many paths and could have hidden regressions

Use change-safety certificate.

## Escalation rule

If any of the following is true, escalate to a heavier template:

- third-party semantics are unclear
- multiple files influence behavior
- hidden registration, middleware, config, or lifecycle paths are involved
- the opposite answer still feels plausible
- a merge or decision will depend on the answer
