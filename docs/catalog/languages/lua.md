---
id: language-pack-lua
kind: language-pack
title: Lua Language Pack
summary: Seeded Lua pack for Neovim, OpenResty, LÖVE, and embedded scripting.
status: stable
owner: core
applies_to:
  - codex
  - claude-code
  - cursor
  - opencode
languages:
  - lua
generated: false
maturity: seeded
targets:
  - codex
  - claude-code
  - cursor
  - opencode
---
# Lua Language Pack

## Best fit

Use this pack for general scripting, Neovim plugins, OpenResty request
handling, LÖVE gameplay modules, and embedded automation.

## What ships

- `knowledge-bases/seeded/lua/docs/overview.md`
- `knowledge-bases/seeded/lua/docs/review-checklist.md`
- `knowledge-bases/seeded/lua/docs/frameworks.md`
- `knowledge-bases/seeded/lua/examples/`
- `knowledge-bases/seeded/lua/rules/common/`
- `knowledge-bases/seeded/lua/rules/lua/`

## Recommended tooling

- Lua
- LuaRocks
- stylua
- luacheck
- busted

## Common pitfalls

- global state leakage
- nil handling surprises
- metatable overuse
- unsafe shell invocation

## Example scenarios

- Neovim plugin
- OpenResty request handler
- LÖVE gameplay module
- embedded automation script
