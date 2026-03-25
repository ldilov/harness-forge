# Testing, Concurrency, Performance

## Testing
- JUnit 5 by default
- use slice tests when the repo already relies on them
- integration tests for persistence and messaging boundaries

## Concurrency and Performance
- distinguish CPU-bound from I/O-bound workloads
- watch thread pool ownership and queueing behavior
- confirm serialization and reflection costs only when they matter on hot paths
