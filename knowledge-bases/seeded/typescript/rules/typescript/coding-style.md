---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.mts"
  - "**/*.cts"
extends: ../common/coding-style.md
language: typescript
layer: language
---
# TypeScript Coding Style

> This file extends [common/coding-style.md](../common/coding-style.md) with TypeScript-specific guidance.

## Types first

- Exported functions and shared modules SHOULD expose explicit types.
- Avoid `any`; use `unknown` and narrow safely.
- Use `interface` for extensible object shapes and `type` for unions and mapped types.

## Runtime truth

- Static types are not runtime validation.
- Validate all untrusted input at boundaries with schemas.

## Project defaults

- Prefer strict compiler options.
- Keep browser-only and server-only code clearly separated.
- Prefer pure functions and immutable updates where practical.
