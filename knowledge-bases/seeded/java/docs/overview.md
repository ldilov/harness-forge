# Java implementation overview

## Why this pack exists

This file is meant to be execution guidance, not a placeholder catalog entry. An agent should load it when Java is the dominant language and use it to choose the correct example, framework notes, and review checklist before editing code.

## Current posture

Spring Boot’s current reference tracks multiple stable lines, including 4.0.x and 3.5.x. JUnit 5 remains the current testing baseline, with strong extension and parameterization support.

## Default operating model

1. Map entrypoints, package or module boundaries, and deployment/runtime assumptions first.
2. Identify trust boundaries: HTTP, CLI, config, files, queues, database rows, environment variables, editor APIs, or host callbacks.
3. Pick the closest matching example scenario from `examples/`.
4. Apply the language rule set plus the common security/testing rules.
5. Verify through the repo's real build and runtime path, not only static analysis.

## What good changes look like

- contracts are explicit
- runtime validation exists where static analysis cannot protect you
- tests cover the changed seam
- logs and errors help operators debug safely
- public behavior changes are called out

## What weak changes look like

- broad refactors with no contract explanation
- framework glue and domain logic mixed together
- hidden global or process-wide state
- missing validation at the boundary
- no mention of rollback, migration, or compatibility

## Scenario routing
- `01-spring-boot-rest-api.md` — **Spring Boot REST API**. Spring MVC or WebFlux edges, request validation, transaction boundaries, and DTO/domain separation.
- `02-event-consumer-service.md` — **Event consumer service**. Kafka or JMS style consumers, retry/dead-letter behavior, idempotency, and schema evolution.
- `03-gradle-multi-module-backend.md` — **Gradle multi-module backend**. Module boundaries, dependency direction, shared test fixtures, and build reproducibility.
- `04-library-module-with-strong-domain-tests.md` — **Library module with strong domain tests**. Pure domain logic, contract-heavy APIs, and tests that cover invariants instead of framework ceremony.

## Required final pass

Before finalizing, walk the language review checklist and confirm the change is safe across correctness, boundary validation, testing, operations, and compatibility.
