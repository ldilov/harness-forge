---
id: paper-source-map
kind: documentation
title: Paper-to-Template Source Map
summary: Maps each file in this bundle back to the specific ideas, sections, and appendices of Agentic Code Reasoning.
status: stable
version: 1
---

# Paper-to-Template Source Map

This document separates **directly paper-derived structure** from **careful project generalization**.

## Paper sections that matter most

### Core thesis

The paper defines semi-formal reasoning as a structured prompting method that forces agents to construct explicit premises, trace execution paths, and derive formal conclusions. The reasoning artifact acts like a **certificate**: the agent cannot skip cases or make unsupported claims.

### Patch equivalence structure

The paper's patch-equivalence template includes:

- definitions
- premises describing what each patch changes
- fail-to-pass and pass-to-pass test analysis
- edge cases relevant to actual tests
- either a counterexample or an explicit no-counterexample argument
- a formal conclusion

This bundle preserves that structure nearly verbatim in:

- `templates/certificates/patch-equivalence-certificate.md`

### Fault localization structure

The paper's fault-localization template adds a four-phase reasoning pipeline:

1. test semantics analysis
2. code path tracing
3. divergence analysis
4. ranked predictions

It also introduces a **structured exploration format**:

- hypothesis
- evidence
- confidence
- observations with line numbers
- hypothesis update
- unresolved questions
- next-action rationale

This bundle preserves that structure in:

- `templates/certificates/fault-localization-certificate.md`
- `templates/logs/semiformal-exploration-log.md`

### Code question answering structure

The paper's code-QA template requires:

- function trace table
- data flow analysis
- semantic properties with evidence
- alternative hypothesis check
- final answer with explicit evidence

This bundle preserves that structure in:

- `templates/certificates/code-question-answering-certificate.md`
- `templates/ledgers/function-trace-table.md`
- `templates/ledgers/data-flow-and-semantic-properties.md`

## What is generalized beyond the paper

The paper studies three evaluation tasks. Real engineering teams need a standard that also works for change planning, code review, and merge safety. The following files are **disciplined generalizations** of the same semi-formal pattern:

- `templates/contracts/semiformal-core-contract.md`
- `templates/certificates/change-safety-certificate.md`
- `workflows/universal-semiformal-investigation-workflow.md`
- `workflows/pre-merge-semiformal-review-workflow.md`

These files intentionally preserve the paper's invariant:

> claims must be backed by evidence and the conclusion must be derivable from the prior record.

## What this bundle refuses to generalize

To stay faithful to the paper, this kit does **not** do the following:

- it does not pretend informal notes are equivalent to a certificate
- it does not replace evidence with confidence language
- it does not allow "probably equivalent" without either a counterexample search or a no-counterexample argument
- it does not allow ranked bug predictions without traceable claims
- it does not let alternative hypotheses vanish when the conclusion matters

## Source-to-file mapping

| Bundle file | Paper alignment | Status |
|---|---|---|
| `templates/certificates/patch-equivalence-certificate.md` | Appendix A / Figure 2 / motivating Django example | direct adaptation |
| `templates/certificates/fault-localization-certificate.md` | Appendix B / Mockito case study | direct adaptation |
| `templates/logs/semiformal-exploration-log.md` | Appendix B structured exploration format | direct adaptation |
| `templates/certificates/code-question-answering-certificate.md` | Appendix D | direct adaptation |
| `templates/ledgers/function-trace-table.md` | Appendix D | extracted helper |
| `templates/ledgers/data-flow-and-semantic-properties.md` | Appendix D | extracted helper |
| `templates/contracts/semiformal-core-contract.md` | common cross-task pattern in Sections 3 and Appendix B/D | careful generalization |
| `templates/certificates/change-safety-certificate.md` | generalized certificate built from the same primitives | careful generalization |
| `workflows/universal-semiformal-investigation-workflow.md` | common behavioral control loop implied by the paper | careful generalization |
| `workflows/pre-merge-semiformal-review-workflow.md` | engineering adoption layer, not directly in paper | careful generalization |

## Empirical lessons that shaped this kit

The paper's error analysis matters as much as the templates.

### Patch-equivalence failure modes

The paper reports that remaining failures often come from:

- incomplete execution tracing
- guessing third-party semantics from names
- noticing a difference but dismissing it as test-irrelevant

Accordingly, this kit adds:

- explicit unresolved assumptions
- mandatory third-party / hidden semantics notes
- required counterexample or no-counterexample sections

### Fault-localization failure modes

The paper identifies:

- indirection bugs
- multi-file bugs
- domain-specific bugs
- cases with more candidate fix regions than the ranking budget

Accordingly, this kit adds:

- indirection checks
- collaborator / config / registration path tracing
- multi-file suspicion tracking
- alternative root-cause candidates

### Code-QA failure mode

The paper shows semi-formal reasoning can still be confidently wrong if the chain is detailed but incomplete.

Accordingly, this kit requires:

- downstream code path continuation
- alternative hypothesis check
- unresolved assumption register
- evidence-quality rating separate from confidence

## Practical takeaway

Use the paper-aligned certificates when the task fits exactly.
Use the generalized contracts only when the problem is broader than the paper's benchmark tasks.
Do not weaken the evidentiary bar during generalization.
