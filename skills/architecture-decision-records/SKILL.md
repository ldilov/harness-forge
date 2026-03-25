---
name: architecture-decision-records
description: Create and maintain small ADRs for significant product, workflow, or packaging decisions.
---

# Architecture Decision Records

## Trigger Signals

- the task changes architecture, package boundaries, runtime behavior, or support claims
- a decision should stay reviewable after the current session

## Inspect First

- the affected spec, plan, and task artifacts
- changed package, runtime, or manifest boundaries
- existing ADRs or decision notes if present

## Workflow

1. identify the decision and the forces driving it
2. summarize options considered and why the chosen path won
3. capture downstream impact on code, docs, and runtime behavior
4. emit a concise ADR entry or update

## Output Contract

- decision summary
- alternatives considered
- consequences and follow-up actions

## Failure Modes

- the real decision has not been framed clearly yet
- no stable rationale exists because requirements are still moving

## Escalation

- escalate when the decision changes support guarantees or cross-team contracts
- escalate when alternatives have materially different operational risk

## References

- `skills/architecture-decision-records/references/adr-template.md`
