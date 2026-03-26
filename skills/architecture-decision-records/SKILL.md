---
name: architecture-decision-records
description: create and maintain high-signal adrs for architecture, package, runtime, workflow, and operational decisions. use when a decision should stay reviewable after the current session or when multiple credible options need a durable rationale.
---

# Architecture Decision Records

## Trigger Signals

- the task changes architecture, package boundaries, runtime behavior, support guarantees, or operating model
- more than one credible option exists and the trade-off should stay reviewable later
- a decision will affect multiple teams, releases, or future migrations

## Inspect First

- the affected specs, tasks, plans, and runtime boundaries
- any existing ADRs, design docs, or release notes that already capture related decisions
- operational constraints such as support window, migration cost, reliability, security, or compliance

## Workflow

1. frame the actual decision, not the implementation diary around it
2. capture the strongest drivers, constraints, and alternatives that were seriously considered
3. choose a concise ADR shape and write context, decision, status, and consequences in plain language
4. note follow-up actions, migration implications, and what would invalidate the decision later
5. update or supersede older ADRs explicitly when the decision changes an earlier one

## Output Contract

- ADR title, status, and date-ready decision summary
- short context section with the forces that matter
- options considered and why the chosen path won
- consequences, follow-up actions, and superseded links when relevant

## Failure Modes

- the real decision has not been framed clearly yet
- the work is still exploratory enough that no stable rationale exists
- the note drifts into a long implementation log instead of a decision record

## Escalation

- escalate when the decision changes public contracts, support commitments, or cross-team ownership
- escalate when alternatives have materially different operational or migration risk
- escalate when the ADR appears to conflict with an existing record and the supersession path is unclear

## References

- `skills/architecture-decision-records/references/adr-template.md`
- `skills/architecture-decision-records/references/decision-rubric.md`
- `skills/architecture-decision-records/references/madr-style-guide.md`
- `skills/architecture-decision-records/references/adr-anti-patterns.md`
- `skills/architecture-decision-records/references/examples.md`
