# Investigation Workflow Guide

Use this flow for evidence-backed investigations where correctness claims may influence implementation, review, or merge outcomes.

## Workflow

1. Define the decision before exploring files.
2. Record premises and scope in the core contract.
3. Open the exploration log and capture hypothesis-before-read.
4. Convert decisive observations into evidence ledger entries.
5. Trace actual behavior paths, including hidden indirection.
6. Run the alternative-hypothesis check.
7. Conclude formally with supported findings and unresolved assumptions.

## Escalation

Escalate from Lite to Standard/Deep when:

- multiple plausible explanations remain
- hidden semantics affect outcome
- merge safety depends on the answer
- counterexample risk is non-trivial
