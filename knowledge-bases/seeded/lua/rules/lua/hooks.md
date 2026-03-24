---
paths:
  - "**/*.lua"
extends: ../common/hooks.md
language: lua
layer: language
---
# Lua Hooks

> This file extends [common/hooks.md](../common/hooks.md) with Lua-specific hook suggestions.

## Post-edit hooks

- `stylua` on edited files
- `luacheck` for static analysis
- `busted` for nearby test suites

## Stop hooks

- host-specific smoke test when plugin/runtime integration changed
- warn on shell execution changes and dynamic code loading
