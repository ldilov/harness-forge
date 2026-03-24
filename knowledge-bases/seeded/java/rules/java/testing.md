---
paths:
  - "**/*.java"
extends: ../common/testing.md
language: java
layer: language
---
# Java Testing

> This file extends [common/testing.md](../common/testing.md) with Java-specific testing guidance.

## Defaults

- Prefer JUnit 5.
- Prefer AssertJ for fluent assertions.
- Use Mockito sparingly; prefer real collaborators when they are cheap to construct.
- Use Testcontainers for integration tests with real databases or brokers.

## Test layering

- fast domain/unit tests
- slice tests for web/data boundaries
- integration tests for full behavior
