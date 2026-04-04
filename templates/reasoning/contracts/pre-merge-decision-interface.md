---
id: pre-merge-decision-interface
kind: task-template
title: Pre-Merge Decision Interface
summary: Deterministic input/output contract for pre-merge recommendations from semiformal reasoning artifacts.
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

# Contract: Pre-Merge Decision Interface

## Purpose

Define deterministic input/output shape for pre-merge recommendations generated from semiformal reasoning artifacts.

## Input Contract

Required inputs:

1. `change_statement`
2. `risk_level` (low | medium | high)
3. `affected_paths`
4. `preserved_behavior_claims`
5. `changed_behavior_claims`
6. `regression_hypotheses`
7. `counterexample_or_no_counterexample_record`
8. `unresolved_assumptions`
9. `evidence_completeness`

Optional inputs:

1. `rollback_trigger`
2. `runtime_guard_conditions`
3. `follow_up_validation_requirements`

## Output Contract

Required outputs:

1. `recommendation` (safe-to-merge | safe-with-conditions | not-yet-safe)
2. `strongest_evidence_in_favor`
3. `strongest_unresolved_concern`
4. `counterexample_status`
5. `assumption_visibility_statement`
6. `what_changes_decision_fastest`

Conditional outputs:

1. `conditions_to_merge` (required when recommendation is safe-with-conditions)
2. `blockers` (required when recommendation is not-yet-safe)

## Decision Rules

1. `safe-to-merge` allowed only when critical paths are traced and no strong alternative explanation remains.
2. `safe-with-conditions` allowed when core claim is strong but bounded assumptions remain.
3. `not-yet-safe` required when decisive path is untraced, counterexample exists, or major hidden semantics remain unverified.

## Validation Rules

1. Recommendation must be derivable from documented claims and evidence.
2. If `evidence_completeness` is low, recommendation cannot be `safe-to-merge`.
3. If unresolved assumptions materially affect correctness, recommendation cannot be unconditional.
4. Reviewer output must include both strongest support and strongest concern.

## Failure Conditions

1. Recommendation selected without explicit rationale linkage
2. Missing counterexample status
3. Hidden semantics noted but not reflected in decision constraints
4. Reviewer comment pattern incomplete

## When to Use

Use when generating or validating pre-merge recommendations from semiformal reasoning artifacts.

## Inputs

- Change statement
- Risk level (low | medium | high)
- Affected paths
- Preserved and changed behavior claims
- Regression hypotheses
- Counterexample or no-counterexample record
- Unresolved assumptions
- Evidence completeness

## Optional Inputs

- Rollback trigger
- Runtime guard conditions
- Follow-up validation requirements

## Constraints

- Recommendation must be derivable from documented claims and evidence
- If evidence completeness is low, recommendation cannot be safe-to-merge
- Unresolved assumptions affecting correctness prevent unconditional recommendation

## Expected Outputs

- Recommendation (safe-to-merge | safe-with-conditions | not-yet-safe)
- Strongest evidence in favor and strongest unresolved concern
- Counterexample status and assumption visibility statement

## Acceptance Criteria

- Recommendation is linked to explicit rationale
- Counterexample status is present
- Hidden semantics are reflected in decision constraints

## Quality Gates

- Reviewer output includes both strongest support and strongest concern
- Conditional outputs are present when required by recommendation type

## Suggested Workflow

1. Gather all required inputs from the reasoning artifact
2. Apply decision rules against evidence
3. Generate recommendation with rationale linkage
4. Validate against failure conditions

## Related Commands

_No specific CLI commands required._

## Related Agents

- Code reviewer agent
- Security reviewer agent

## Examples

_Refer to the input/output contract and decision rules above for usage examples._
