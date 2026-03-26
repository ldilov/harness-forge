# Architecture And DI

## Composition root discipline

Register dependencies at the application boundary and keep feature code free of service locator behavior. Constructor injection keeps required dependencies explicit and easier to review.

## Lifetime heuristics

- **Singleton**: stateless, thread-safe, cache-like, or expensive shared resources with careful ownership
- **Scoped**: request or message bound behavior such as `DbContext`
- **Transient**: lightweight components without shared mutable state

When in doubt, start with scoped or transient and promote only with evidence.

## Configuration

Use typed options for stable configuration groups. Validate values that would make startup unsafe or cause silent runtime corruption. Avoid sprinkling raw configuration lookups through feature code.

## Boundary choices

- keep transport types near the transport layer
- keep persistence details near infrastructure code
- let domain or application types express business rules
- use interfaces when a real seam exists, not by reflex

## HTTP and outgoing calls

Centralize HTTP client construction and resilience behavior. Prefer typed or named clients over ad hoc `new HttpClient()` creation. Keep retry, timeout, and authentication behavior visible.
