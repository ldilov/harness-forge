---
name: lua-engineering
description: Lua engineering guidance seeded from the Harness Forge knowledge base.
origin: Harness Forge
---

# Lua Engineering

Use this skill when the repo contains `.lua` files or when the task involves
Neovim plugins, OpenResty, Love2D, embedded scripting, or Lua automation.

## Primary rule sources

- `rules/common/coding-style.md`
- `rules/common/patterns.md`
- `rules/common/testing.md`
- `rules/common/security.md`
- `rules/common/hooks.md`
- `rules/lua/coding-style.md`
- `rules/lua/patterns.md`
- `rules/lua/testing.md`
- `rules/lua/security.md`
- `rules/lua/hooks.md`

## Seeded references

- `knowledge-bases/seeded/lua/docs/overview.md`
- `knowledge-bases/seeded/lua/docs/review-checklist.md`
- `knowledge-bases/seeded/lua/docs/frameworks.md`
- `knowledge-bases/seeded/lua/examples/`

## Assistant expectations

- keep modules small, readable, and compatible with the target runtime
- prefer explicit table contracts and simple control flow
- use the seeded examples for framework-specific idioms before improvising
- review hooks, security, and testing guidance before shipping changes
