# Node Service Patterns

## Service boundaries

- keep request parsing and auth near the transport edge
- isolate domain logic from framework glue
- centralize configuration, logging, and shutdown behavior
- make retries, timeouts, and concurrency visible in code rather than implicit in nested helpers

## Operational concerns

- validate env vars before startup continues
- handle process signals and graceful shutdown explicitly
- avoid unbounded background work tied to request handlers
- surface health and readiness checks where deployment expects them
