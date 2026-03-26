# Rollout And Backfill

## Backfill rules

- chunk work by a stable key or bounded window
- checkpoint progress so the job can resume safely
- make the job idempotent
- throttle to protect hot paths and replicas
- emit metrics for rows processed, lag, failures, and remaining work

## Rollout checks

- deployment order between schema, app, and backfill job
- whether reads and writes remain correct before the backfill completes
- whether monitoring can distinguish migration-induced errors from ordinary traffic noise
- whether rollback means actual rollback or forward-fix with a new migration

## Verification ideas

- row count parity between old and new shapes
- null or default-value audits
- duplicate detection before adding uniqueness constraints
- query plans on new indexes for hot endpoints
