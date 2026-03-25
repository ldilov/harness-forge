# Examples

## Example: Design multi-tenant SaaS backend
- isolate tenant data model
- choose identity/auth boundary
- define noisy-neighbor controls
- plan observability dimensions by tenant and workload
- decide whether tenant isolation is logical, pooled, or dedicated

## Example: Migrate monolith to cloud without over-fragmenting
- first containerize or platform-host intact service
- extract seams only where scaling, ownership, or release cadence justify it
- preserve transaction and data consistency behavior during transition

## Example: Event-driven integration
- define event schema ownership
- idempotent consumers
- dead-letter handling and replay policy
- tracing across async boundaries
