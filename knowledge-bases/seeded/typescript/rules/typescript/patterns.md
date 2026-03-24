---
paths:
  - "**/*.ts"
  - "**/*.tsx"
extends: ../common/patterns.md
language: typescript
layer: language
---
# TypeScript Patterns

> This file extends [common/patterns.md](../common/patterns.md) with TypeScript-specific patterns.

## Recommended patterns

- schema-driven API/input validation
- typed repository or service boundaries
- explicit DTO mapping between transport and domain
- shared packages for contracts only when versioning and ownership are clear

## Frontend note

- Keep server-fetching logic, UI state, and domain formatting concerns separated.
- Use custom hooks for reuse, not for hiding unrelated logic.
