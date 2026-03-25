---
paths:
  - "**/*.lua"
extends: ../common/security.md
language: lua
layer: language
---
# Lua Security

> This file extends [common/security.md](../common/security.md) with Lua-specific security guidance.

## Defaults

- Never concatenate untrusted input into shell commands.
- Validate file paths, command arguments, and network inputs.
- Be careful with dynamic `load`, `loadfile`, or code evaluation features.

## Host-specific note

- OpenResty and editor/plugin environments still process untrusted data; validate aggressively at boundaries.
