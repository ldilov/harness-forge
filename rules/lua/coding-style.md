---
paths:
  - "**/*.lua"
extends: ../common/coding-style.md
language: lua
layer: language
---
# Lua Coding Style

> This file extends [common/coding-style.md](../common/coding-style.md) with Lua-specific guidance.

## Defaults

- Keep modules small and explicit.
- Avoid accidental globals; prefer `local` by default.
- Use tables deliberately: distinguish array-like, map-like, and object-like usage.
- Prefer clear function contracts over metatable cleverness.

## Nil and truthiness

- Document when `nil` is a valid return value.
- Avoid APIs where `false` and `nil` become ambiguous.

## Module design

- Return explicit module tables.
- Keep side effects at module load time minimal.
