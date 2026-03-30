# Examples

## Example 1: dependency upgrade

**Change:** upgrade a database driver in one service.

**Why this is interesting:** the direct code change is small, but runtime behavior and connection management may shift.

**Likely result:**
- impact quantity: contained
- risk: medium
- confidence: usable or strong, depending on release notes and integration evidence
- key checks: connection pool behavior, retry semantics, TLS/auth defaults, timeout behavior

## Example 2: schema migration

**Change:** split one table into two with a rolling backfill.

**Why this is interesting:** the application diff may look manageable while rollout and rollback become complex.

**Likely result:**
- impact quantity: broad or wide
- risk: high or critical
- confidence: weak unless consumer coverage and migration steps are explicit
- key checks: dual-read/write windows, replay safety, old-reader compatibility, repair plan

## Example 3: internal refactor

**Change:** move shared validation logic into a new internal package without changing external contracts.

**Why this is interesting:** many files may change, but the external blast radius can stay low.

**Likely result:**
- impact quantity: broad
- risk: low or medium
- confidence: strong when contract tests and behavior snapshots exist
- key checks: semantic parity, package boundary leaks, performance regression, logging drift
