# OpenResty Patterns

## Request-phase awareness

Know which NGINX phase the code runs in before changing behavior. Request rewriting, access checks, content generation, timers, and worker init all have different constraints.

## Nonblocking discipline

Prefer host-approved nonblocking APIs and shared libraries already used by the repo. Do not assume that generic Lua socket or filesystem behavior is safe inside a latency-sensitive request path.

## Operational checks

- verify worker initialization behavior
- note shared dictionary or cache dependencies
- keep per-request allocations and logging under control on hot paths
