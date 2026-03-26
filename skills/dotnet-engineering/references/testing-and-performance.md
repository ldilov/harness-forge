# Testing And Performance

## Testing layers

- unit tests for pure logic and edge cases
- integration tests for middleware, serialization, persistence, and auth boundaries
- focused end-to-end or smoke checks for the highest-risk runtime paths

If the repo already uses `WebApplicationFactory`, extend that path for endpoint and middleware verification instead of building custom harnesses.

## Worker and background testing

Prefer extracting loop bodies or handlers into testable units. Validate retry, idempotency, and cancellation logic separately from the host loop.

## Performance hotspots

- repeated allocations in hot paths
- synchronous I/O on request threads
- oversized object graphs or serializer churn
- database overfetch and chatty data access
- logging inside tight loops without level guards

## Validation hints

Use the narrowest command that proves the change. When performance is part of the task, compare before and after behavior with the same workload shape instead of relying on intuition.
