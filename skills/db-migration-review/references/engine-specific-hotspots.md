# Engine Specific Hotspots

## PostgreSQL

Watch for table rewrites, long-running transactions, constraint validation cost, and index creation strategy. Large DDL can block more than the migration author expects if it runs on hot tables.

## MySQL and MariaDB

Watch for metadata locks, table-copy behavior, and cut-over risk. Online-migration tools can reduce risk, but they introduce their own operational steps and failure modes.

## SQL Server

Watch for index rebuild behavior, lock escalation, long transactions, and the difference between online and offline operations.

## SQLite and embedded stores

Many schema changes are effectively copy-and-rewrite operations. Treat data volume and file-lock behavior as rollout concerns, not just local-dev concerns.

## Cross-engine rule

If the migration tool abstracts SQL away, inspect the emitted SQL or engine-specific plan before approving anything beyond trivial additive changes.
