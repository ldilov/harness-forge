---
name: db-migration-review
description: Review database migrations for safety, reversibility, and rollout risk.
---

# DB Migration Review

## Trigger Signals

- the task adds or changes database migrations or schema-affecting code

## Inspect First

- migration files, schema models, rollout assumptions, and data backfills

## Workflow

1. identify schema and data-shape changes
2. evaluate rollout, lock, and backfill risk
3. check reversibility and validation
4. summarize approval or follow-up actions

## Output Contract

- migration risk summary
- rollback note
- validation and rollout expectations

## Failure Modes

- schema impact cannot be inferred from the migration alone

## Escalation

- escalate when the migration risks data loss, long locks, or non-reversible rollout
