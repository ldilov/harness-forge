---
paths:
  - "**/*.lua"
extends: ../common/testing.md
language: lua
layer: language
---
# Lua Testing

> This file extends [common/testing.md](../common/testing.md) with Lua-specific testing guidance.

## Defaults

- Use Busted for Lua tests where practical.
- Prefer pure functions and small modules that are easy to test outside the host runtime.
- Stub host APIs explicitly in Neovim, OpenResty, or game-hosted code.

## Coverage priorities

- config normalization
- command routing
- host API adapters
- serialization/parsing behavior
