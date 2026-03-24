---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "package.json"
extends: ../common/hooks.md
language: typescript
layer: language
---
# TypeScript Hooks

> This file extends [common/hooks.md](../common/hooks.md) with TypeScript-specific hook suggestions.

## Post-edit hooks

- formatter (Prettier or project formatter)
- eslint on affected files
- `tsc --noEmit` or project typecheck
- affected unit tests when behavior changes

## Stop hooks

- final typecheck
- warn on `console.log` in production paths
- dependency audit when lockfiles change
