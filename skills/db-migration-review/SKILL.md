---
name: db-migration-review
description: review database migrations for safety, compatibility windows, backfills, reversibility, and rollout risk. use when migration files, schema diffs, orm model changes, indexes, constraints, or data backfills change.
---

# DB Migration Review

## Trigger Signals

- the task adds or edits migrations, DDL, backfills, seed data, or schema-affecting ORM changes
- the change touches EF Core, Flyway, Liquibase, Prisma, Atlas, handcrafted SQL, or online migration tooling
- rollout safety matters because the database is large, hot, replicated, or shared by multiple services

## Inspect First

- migration files, generated SQL, and schema model diffs
- the application code that reads or writes the changed tables or columns
- deployment order, backfill jobs, feature flags, and rollback expectations
- table size, hot paths, index usage, and engine-specific lock sensitivity when evidence exists

## Workflow

1. classify the change as additive, destructive, rewrite-heavy, data-moving, or operationally sensitive
2. determine the compatibility window between old code, new code, and intermediate schema states
3. inspect lock, rewrite, replication, and backfill risk with the engine and tool in mind
4. verify reversibility, forward-fix options, and post-deploy validation steps
5. emit a risk-ranked review with concrete rollout guidance, not generic warnings

## Output Contract

- migration summary grouped by schema change, data change, and rollout shape
- risk level with the exact reasons it is safe, risky, or blocked
- expand-and-contract verdict, rollback or forward-fix plan, and validation queries or checks
- follow-up tasks for app changes, monitoring, throttling, or staged deployment

## Failure Modes

- engine, table size, or traffic profile is unknown and materially changes risk
- the migration file exists without the surrounding application rollout plan
- generated SQL is unavailable for toolchains that hide the real DDL

## Escalation

- escalate when a migration can drop data, rewrite a large table, block hot paths, or break mixed-version application deployments
- escalate when backfills are non-idempotent, unthrottled, or lack checkpointing
- escalate when rollback is impossible and no forward-fix path or validation telemetry exists

## References

- `skills/db-migration-review/references/risk-taxonomy.md`
- `skills/db-migration-review/references/expand-contract.md`
- `skills/db-migration-review/references/engine-specific-hotspots.md`
- `skills/db-migration-review/references/tooling-signals.md`
- `skills/db-migration-review/references/rollout-and-backfill.md`
- `skills/db-migration-review/references/review-template.md`
- `skills/db-migration-review/references/examples.md`
