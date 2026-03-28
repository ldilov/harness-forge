# SOLID and Patterns

Use this reference to keep engineering-assistant output practical and explicit
rather than abstract for abstraction's sake.

## SOLID priorities

- single responsibility: each module should have one clear reason to change
- open or closed: extend through composition and policy seams rather than branching everywhere
- Liskov substitution: verify interface contracts with tests when implementations vary
- interface segregation: keep interfaces small and split sync versus async or read versus write concerns when useful
- dependency inversion: point business logic at abstractions and isolate DB, HTTP, FS, and queue details behind boundaries

## Preferred patterns

- dependency injection when construction or orchestration is non-trivial
- strategy or policy objects for replaceable behavior
- adapter layers for infrastructure and third-party integration seams
- factories only when object creation truly needs orchestration
- specification-style rules for explicit business predicates
- repositories only when aggregate coordination is complex enough to justify them

## Anti-patterns

- god services with broad ownership and vague boundaries
- service locators and global state disguised as convenience
- anemic domains where all real behavior lives in handlers or controllers
- premature interfaces for everything before behavior actually diverges

## Refactoring guidance

- preserve behavior unless the change explicitly authorizes a semantic shift
- prefer small, test-backed slices that keep the repo releasable after each step
- include migration notes when public contracts, persistence formats, or operational behavior change
