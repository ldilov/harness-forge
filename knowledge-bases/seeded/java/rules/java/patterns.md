---
paths:
  - "**/*.java"
extends: ../common/patterns.md
language: java
layer: language
---
# Java Patterns

> This file extends [common/patterns.md](../common/patterns.md) with Java-specific patterns.

## Recommended architecture

- Keep controllers/resources thin.
- Put orchestration in services/use cases.
- Keep persistence and transport concerns away from the domain model.
- Prefer explicit transaction boundaries.

## Build systems

- Support both Gradle and Maven in docs where practical.
- Do not make framework-specific assumptions in core rules unless the file is clearly framework-scoped.
