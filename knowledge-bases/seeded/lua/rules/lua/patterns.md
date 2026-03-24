---
paths:
  - "**/*.lua"
extends: ../common/patterns.md
language: lua
layer: language
---
# Lua Patterns

> This file extends [common/patterns.md](../common/patterns.md) with Lua-specific patterns.

## Recommended patterns

- pure helper modules for business logic
- adapter modules for host/editor/runtime integration
- table-based configuration with validation/normalization step
- explicit module return tables instead of hidden shared state

## Environment-specific notes

- Neovim: isolate editor API calls behind small adapters.
- OpenResty: separate request parsing, business logic, and response writing.
- Games/embedded hosts: isolate frame/update state mutation from pure computations.
