---
paths:
  - "**/*.java"
extends: ../common/security.md
language: java
layer: language
---
# Java Security

> This file extends [common/security.md](../common/security.md) with Java-specific security guidance.

## Application security

- Validate external inputs at the web or messaging edge.
- Use framework security primitives instead of ad hoc auth parsing.
- Do not expose stack traces, SQL text, or internal paths in responses.

## Data access

- Use prepared statements or framework equivalents.
- Review ORM fetch strategies and serialization carefully to avoid data leakage.
