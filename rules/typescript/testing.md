---
paths:
  - "**/*.ts"
  - "**/*.tsx"
extends: ../common/testing.md
language: typescript
layer: language
---
# TypeScript Testing

> This file extends [common/testing.md](../common/testing.md) with TypeScript-specific testing guidance.

## Defaults

- Prefer Vitest or Jest for unit/integration tests depending on project standards.
- Use Playwright for user-facing end-to-end flows.
- Test runtime validation, auth, error translation, and serialization explicitly.

## Monorepo note

- Run affected tests when available.
- Guard shared package changes with focused integration coverage.
