# Agent Patterns

## Non-negotiables

- prefer repository evidence over generic framework advice
- preserve established boundaries unless the task explicitly calls for redesign
- keep public contracts stable and make behavior changes explicit
- bias toward small, reversible edits with clear validation

## Default design moves

- inject dependencies through constructors instead of resolving them ad hoc
- bind configuration once, validate where failure should be surfaced, and pass typed settings inward
- keep controllers, endpoints, and message handlers thin; move orchestration into application services or domain modules
- propagate `CancellationToken` through I/O and background workflows
- add packages only when the repo lacks an equivalent abstraction or pattern already in use

## Review questions

- which project should own this behavior?
- where is configuration bound, validated, and refreshed?
- what is the narrowest test seam that proves the change?
- does the change alter a public contract, migration sequence, or deployment assumption?

## Avoid

- service locator patterns or hidden runtime resolution
- fire-and-forget tasks inside request paths
- long-lived tracked entities with implicit side effects
- repository-wide rewrites when the task needs a local fix
