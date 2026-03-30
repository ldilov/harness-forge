---
id: rules-lua
kind: rule
title: Lua Rules
summary: Entry point for the seeded Lua baseline and language-specific rule set.
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
---
# Lua Rules

## Apply Order

1. start with `rules/common/`
2. layer `rules/lua/` for module structure, runtime flavor, and testing guidance
3. consult `knowledge-bases/seeded/lua/rules/lua/` when the seeded pack has deeper runtime or review cues

## Focus Areas

- runtime flavor differences such as Neovim, OpenResty, and embedded Lua hosts
- module boundaries, validation, and compatibility-safe refactors
- testing, tooling, and security considerations for scriptable environments

## Related Pack Assets

- `rules/common/`
- `rules/lua/`
- `knowledge-bases/seeded/lua/rules/lua/`
- `skills/lua-engineering/SKILL.md`
- `templates/workflows/implement-lua-change.md`
