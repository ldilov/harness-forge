# Async and Concurrency

## When to Use asyncio
Use asyncio when the workload is I/O bound and the ecosystem already exposes async APIs.

## Rules
- Do not mix sync and async haphazardly; make boundary adapters explicit.
- Avoid blocking calls inside async paths.
- Use timeouts, cancellation propagation, and context-aware cleanup.
- Prefer task groups or structured concurrency patterns when available.

## Common Pitfalls
- calling synchronous DB or HTTP clients in async handlers
- fire-and-forget tasks without lifecycle ownership
- hidden event loop assumptions in tests
- mutable shared state across async tasks

## Example
A FastAPI handler should delegate to async service functions only if the underlying client stack is async end-to-end.
