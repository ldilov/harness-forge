# Frontend And Backend Patterns

## Backend

- keep request parsing, auth, and validation at the edge
- isolate business logic from transport and framework helpers
- prefer explicit DTO mapping at service boundaries
- keep side effects behind small abstractions that are easy to test

## Frontend

- keep server-state fetching separate from view components when the framework supports it
- colocate component-specific logic, but move shared domain logic into stable modules
- make loading, empty, error, and optimistic states explicit
- keep browser-only APIs behind effect or boundary modules

## Shared packages

Only centralize code when at least two consumers already need the same contract or behavior. Premature shared packages create more churn than they save.
