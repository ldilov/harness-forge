# Expand And Contract

## Default rollout shape

1. **Expand**: add new columns, tables, indexes, or write paths in a backward-compatible way
2. **Dual-read or dual-write when needed**: let old and new application versions coexist safely
3. **Backfill**: migrate existing data in resumable chunks with checkpointing and monitoring
4. **Contract**: remove old columns or code paths only after traffic proves the new path is stable

## Good questions

- can old binaries run against the new schema?
- can new binaries run before the backfill finishes?
- is there a safe intermediate state for blue-green or rolling deploys?
- what proves the contract phase is safe to execute later?

## Common trap

Schema tools often make additive changes easy and destructive changes too easy. A safe review always asks how mixed-version application traffic behaves between those two phases.
