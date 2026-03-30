# Impact Lenses

Use this file when a change crosses boundaries or when the blast radius is unclear.

## Quick map from change type to likely hidden impacts

| Change type | Hidden impacts to check first |
|---|---|
| refactor | hidden consumers, performance regressions, test brittleness, observability drift |
| dependency upgrade | transitive behavior changes, deprecations, security patches, build/runtime differences |
| schema migration | backward compatibility, dual-read/write windows, data repair, rollback safety |
| api change | undocumented consumers, generated clients, retries, idempotency, versioning |
| infra or manifest change | network reachability, permissions, resource limits, rollout ordering, cold starts |
| config or flag change | default behavior, environment skew, stale config, partial enablement |
| auth or iam change | least privilege violations, broken automation, audit gaps, emergency access |
| queue or scheduler change | ordering, duplication, throughput collapse, poison messages, delayed failures |
| ui or workflow change | support load, analytics drift, user confusion, docs mismatch |

## Lens-by-lens prompts

### A. Functional behavior
Check:
- external behavior changes
- failure-path behavior changes
- retry semantics
- ordering and idempotency
- default values and fallback paths

### B. Contracts and compatibility
Check:
- required vs optional fields
- renamed fields or enums
- semantic meaning changes without shape changes
- version skew between producer and consumer
- generated code or SDK breakage

### C. Data semantics and lifecycle
Check:
- live migrations and backfills
- nullability and default values
- historical data compatibility
- replay and reprocessing behavior
- cache invalidation or derived data freshness

### D. Runtime and operational characteristics
Check:
- latency and tail latency
- memory and CPU profile
- connection pool, file handle, thread, or coroutine pressure
- autoscaling signal alignment
- resilience under partial failure

### E. Security, privacy, and compliance
Check:
- permission expansion
- secret exposure or secret rotation coupling
- sensitive data path changes
- audit trail completeness
- region, residency, or retention obligations

### F. Observability and diagnosability
Check:
- metric names and cardinality
- missing logs or traces on new paths
- alert thresholds that no longer fit
- dashboards that silently go stale
- ability to localize rollback decisions quickly

### G. Delivery and rollback mechanics
Check:
- coordinated multi-service deploy requirements
- data shape compatibility during rollback
- one-way migrations
- queued work created by the new version but unreadable by the old version
- cleanup work after rollback

### H. Human and process coupling
Check:
- runbook and support implications
- QA scenario coverage
- documentation or stakeholder communication gaps
- compliance review requirements
- on-call cognitive load

## Anti-patterns

Watch for these misleading statements:

- “only a config change”
- “just a refactor”
- “backward compatible” without consumer evidence
- “small diff” used as evidence of low impact
- “tested locally” used as evidence of low runtime risk
- “behind a flag” without proving safe partial activation

## Minimum evidence by severity

### For low-risk claims
Require at least:
- direct artifact review
- known consumers reviewed or bounded
- basic validation path identified

### For medium-risk claims
Require at least:
- artifact review
- downstream consumer scan
- rollback path
- observability plan

### For high-risk or critical claims
Require at least:
- explicit compatibility reasoning
- migration/rollback reasoning
- staged rollout design
- owner alignment and stop conditions
