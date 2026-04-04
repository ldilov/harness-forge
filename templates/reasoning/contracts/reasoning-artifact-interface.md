# Contract: Reasoning Artifact Interface

## Purpose

Define required fields and invariants for all reasoning artifacts produced by this feature.

## Producers

1. Investigation authors
2. Change authors
3. Reviewers generating formal recommendations

## Consumers

1. Reviewers and approvers
2. Team leads enforcing governance
3. Maintainers auditing artifact quality

## Artifact Types

1. Core contract
2. Exploration log
3. Ledgers (function trace, data flow)
4. Certificates (patch-equivalence, fault-localization, code-QA, change-safety)
5. Workflow records

## Required Fields (All Material Artifacts)

1. `task_statement`
2. `scope`
3. `premises`
4. `evidence_ledger`
5. `claims`
6. `alternative_hypothesis_check`
7. `formal_conclusion`
8. `unresolved_assumptions`
9. `evidence_completeness`

## Additional Required Fields (Certificate Artifacts)

1. `certificate_type`
2. `decision_or_answer`
3. `counterexample_status`
4. `recommendation` (if merge-related)

## Invariants

1. Every material claim references at least one premise and one evidence item.
2. Every evidence item includes source and location.
3. Alternative hypothesis must be evaluated for consequential decisions.
4. Confidence cannot override low evidence completeness.
5. Unresolved assumptions remain visible in final outputs.

## Allowed Outcomes

1. `supported`
2. `supported-with-assumptions`
3. `unresolved`
4. `not-supported`

## Rejection Conditions

1. Missing evidence locations for material claims
2. No alternative-hypothesis section on consequential decisions
3. Formal conclusion introduces claims not established in artifact body
4. Recommendation present without counterexample status
