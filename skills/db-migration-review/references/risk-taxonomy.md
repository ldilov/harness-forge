# Risk Taxonomy

## Usually low risk

- adding nullable columns
- adding non-blocking indexes with an engine-appropriate strategy
- additive tables not yet referenced by production traffic
- additive enum or lookup values where consumers tolerate them

## Medium risk

- tightening nullability after a backfill
- renaming columns or tables when the migration tool may emit drop-and-create SQL
- adding unique constraints after validating existing data
- large backfills that are chunked but still compete with production load

## High risk

- dropping columns, tables, indexes, or enum values still used by live code
- type narrowing or incompatible default changes
- table rewrites on hot paths
- online migrations that depend on exact replica, trigger, or cut-over behavior
- mixed app and schema rollouts without an intermediate compatibility window

## Block until clarified

- no rollback or forward-fix strategy
- backfill logic cannot resume safely
- generated SQL is unavailable for a complex migration
- production traffic shape, table size, or engine is unknown for a potentially invasive change
