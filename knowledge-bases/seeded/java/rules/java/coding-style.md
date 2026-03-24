---
paths:
  - "**/*.java"
extends: ../common/coding-style.md
language: java
layer: language
---
# Java Coding Style

> This file extends [common/coding-style.md](../common/coding-style.md) with Java-specific guidance.

## Defaults

- Prefer immutable models and `record` for value types where supported.
- Use constructor injection, not field injection.
- Keep package structure aligned with domains or features.
- Keep APIs explicit and readable rather than overly abstract.

## Modern language features

- Use records, sealed hierarchies, pattern matching, text blocks, and switch expressions when they improve clarity.
- Avoid introducing modern syntax only for novelty; keep readability first.
