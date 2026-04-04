---
id: reasoning-artifact-interface
kind: task-template
title: Reasoning Artifact Interface
summary: Required fields and invariants for all reasoning artifacts produced by the semiformal reasoning feature.
category: reasoning
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

## When to Use

Use when producing or validating any reasoning artifact to ensure required fields and invariants are met.

## Inputs

- Task statement and scope
- Premises and evidence ledger
- Claims and alternative hypothesis check
- Formal conclusion and unresolved assumptions

## Optional Inputs

- Certificate type and decision or answer (for certificate artifacts)
- Recommendation (for merge-related artifacts)

## Constraints

- Every material claim must reference at least one premise and one evidence item
- Every evidence item must include source and location
- Alternative hypothesis must be evaluated for consequential decisions
- Confidence cannot override low evidence completeness

## Expected Outputs

- Validated reasoning artifact conforming to required fields
- Outcome classification (supported | supported-with-assumptions | unresolved | not-supported)

## Acceptance Criteria

- All required fields are present for the artifact type
- Invariants are satisfied
- No rejection conditions are triggered

## Quality Gates

- Evidence locations are present for all material claims
- Alternative-hypothesis section exists for consequential decisions
- Formal conclusion does not introduce claims absent from artifact body

## Suggested Workflow

1. Identify artifact type (core contract, log, ledger, certificate, workflow)
2. Verify required fields are present
3. Check invariants
4. Validate against rejection conditions

## Related Commands

_No specific CLI commands required._

## Related Agents

- Code reviewer agent

## Examples

_Refer to the required fields, invariants, and rejection conditions above for validation examples._
