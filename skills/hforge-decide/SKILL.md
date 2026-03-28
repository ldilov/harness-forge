---
name: hforge-decide
description: create or update durable asr or adr records for harness forge workspaces. use when an analysis or implementation choice changes runtime behavior, package boundaries, support posture, migration strategy, or any other architecture-significant concern that should remain reviewable after the current session.
---

# HForge Decide

## Trigger Signals

- an analysis or implementation choice has architecture-significant consequences
- the repo already has decision records and the new work should link to them
- multiple credible options exist and the rationale should stay durable
- a task pack, impact analysis, or review surfaced a decision candidate that should not stay implicit

## Inspect First

- `.hforge/runtime/decisions/index.json`
- `.hforge/runtime/tasks/`
- `.hforge/runtime/findings/`
- `.hforge/runtime/repo/recommendations.json`
- the most relevant existing ASR or ADR if one already exists

## Workflow

1. frame the decision clearly before writing anything
2. inspect related task packs, impact analysis, risk signals, and existing decision records
3. create an ASR when the direction is still being evaluated and an ADR when the decision is accepted enough to guide future work
4. write the record under `.hforge/runtime/decisions/` with context, decision, consequences, constraints, risks, and follow-up actions
5. update supersession or related-record links when the new decision changes an earlier one

## Output Contract

- a concise ASR or ADR with explicit status and rationale
- links to related tasks, impacts, and superseded records
- follow-up actions or open questions when the work is not fully settled

## Validation Path

- `.hforge/runtime/decisions/index.json`
- `schemas/runtime/decision-record.schema.json`
- `schemas/runtime/architecture-significance.schema.json`

## Failure Modes

- the real decision is still too vague to record
- there is not enough evidence to justify a durable record yet
- the new record conflicts with an existing one and the supersession path is unclear

## Escalation

- escalate when the decision changes public support or target guarantees
- escalate when migration or rollback cost is materially different across options
- escalate when a new record would contradict an existing accepted ADR

## References

- `skills/hforge-decide/references/decision-rubric.md`
- `skills/hforge-decide/references/output-contract.md`
